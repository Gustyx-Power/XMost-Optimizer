# Module 2: Memory Orchestrator

## Description
Manajemen memory Windows dengan purge standby list via NTAPI dan timer resolution adjustment untuk low-latency operations.

## Dependencies
- **External Crates**: `windows-sys`, `winapi`, `tokio`
- **Internal Modules**: `utils::privilege_check`, `utils::error_handler`

## Core Features

### 1. One-Click Memory Purge (NTAPI)
**Mechanism**: Call undocumented `NtSetSystemInformation` dengan `SYSTEM_MEMORY_LIST_COMMAND`

**Memory List Commands**:
- `MemoryPurgeStandbyList` (4) - Purge standby memory
- `MemoryEmptyWorkingSets` (2) - Empty working sets
- `MemoryCombineMemoryLists` (3) - Combine memory lists

**Rust Implementation**:
```rust
// src-tauri/src/modules/memory_orchestrator/ntapi_wrapper.rs
use windows_sys::Win32::System::SystemInformation::{
    NtSetSystemInformation, SYSTEM_INFORMATION_CLASS
};

const SYSTEM_MEMORY_LIST_INFORMATION: SYSTEM_INFORMATION_CLASS = 80;
const MEMORY_PURGE_STANDBY_LIST: i32 = 4;

pub struct MemoryPurger {
    last_purge_time: Option<std::time::Instant>,
}

impl MemoryPurger {
    pub fn new() -> Self {
        Self { last_purge_time: None }
    }

    pub fn purge_standby_list(&mut self) -> Result<u64, String> {
        // 1. Check admin privileges
        if !crate::utils::privilege_check::is_elevated() {
            return Err("Administrator privileges required".to_string());
        }

        // 2. Get current standby size before purge
        let before_mb = self.get_standby_size_mb()?;

        // 3. Call NTAPI
        unsafe {
            let command = MEMORY_PURGE_STANDBY_LIST;
            let result = NtSetSystemInformation(
                SYSTEM_MEMORY_LIST_INFORMATION,
                &command as *const i32 as *const _,
                std::mem::size_of::<i32>() as u32,
            );

            if result != 0 {
                return Err(format!("NtSetSystemInformation failed with code: {}", result));
            }
        }

        // 4. Calculate freed memory
        std::thread::sleep(std::time::Duration::from_millis(100));
        let after_mb = self.get_standby_size_mb()?;
        let freed_mb = before_mb.saturating_sub(after_mb);

        self.last_purge_time = Some(std::time::Instant::now());

        Ok(freed_mb)
    }

    fn get_standby_size_mb(&self) -> Result<u64, String> {
        // Query via WMI or GlobalMemoryStatusEx
        let memory_stats = crate::modules::dashboard::get_memory_stats()
            .map_err(|e| e.to_string())?;
        Ok(memory_stats.standby_mb)
    }
}
```

### 2. Auto-Purge Background Service
**Configuration**:
- Enable/Disable toggle
- Threshold (default: 4096 MB)
- Check interval (default: 5000 ms)

**Rust Implementation**:
```rust
// src-tauri/src/modules/memory_orchestrator/purge_engine.rs
use tokio::sync::mpsc;
use std::sync::{Arc, Mutex};

pub struct AutoPurgeConfig {
    pub enabled: bool,
    pub threshold_mb: u64,
    pub check_interval_ms: u64,
}

impl Default for AutoPurgeConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            threshold_mb: 4096,
            check_interval_ms: 5000,
        }
    }
}

pub struct AutoPurgeService {
    config: Arc<Mutex<AutoPurgeConfig>>,
    purger: Arc<Mutex<MemoryPurger>>,
    shutdown_tx: Option<mpsc::Sender<()>>,
}

impl AutoPurgeService {
    pub fn new() -> Self {
        Self {
            config: Arc::new(Mutex::new(AutoPurgeConfig::default())),
            purger: Arc::new(Mutex::new(MemoryPurger::new())),
            shutdown_tx: None,
        }
    }

    pub fn start(&mut self) -> Result<(), String> {
        let (tx, mut rx) = mpsc::channel::<()>(1);
        self.shutdown_tx = Some(tx);

        let config = Arc::clone(&self.config);
        let purger = Arc::clone(&self.purger);

        tokio::spawn(async move {
            loop {
                tokio::select! {
                    _ = rx.recv() => {
                        log::info!("Auto-purge service shutting down");
                        break;
                    }
                    _ = tokio::time::sleep(tokio::time::Duration::from_millis(
                        config.lock().unwrap().check_interval_ms
                    )) => {
                        let cfg = config.lock().unwrap();
                        if !cfg.enabled {
                            continue;
                        }

                        // Check standby list size
                        if let Ok(standby_mb) = purger.lock().unwrap().get_standby_size_mb() {
                            if standby_mb >= cfg.threshold_mb {
                                log::info!("Auto-purge triggered: {} MB >= {} MB", 
                                    standby_mb, cfg.threshold_mb);
                                
                                if let Err(e) = purger.lock().unwrap().purge_standby_list() {
                                    log::error!("Auto-purge failed: {}", e);
                                }
                            }
                        }
                    }
                }
            }
        });

        Ok(())
    }

    pub fn stop(&mut self) {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.try_send(());
        }
    }

    pub fn update_config(&self, config: AutoPurgeConfig) {
        *self.config.lock().unwrap() = config;
    }
}
```


### 3. Timer Resolution Setter
**Purpose**: Set Windows timer resolution ke 0.5ms untuk low-latency operations (gaming, audio production)

**NTAPI Functions**:
- `NtSetTimerResolution(DesiredResolution, SetResolution, CurrentResolution)`
- `NtQueryTimerResolution(MinimumResolution, MaximumResolution, CurrentResolution)`

**Cleanup Strategy**: Restore original resolution saat app exit

**Rust Implementation**:
```rust
// src-tauri/src/modules/memory_orchestrator/timer_resolution.rs
use windows_sys::Win32::Foundation::NTSTATUS;

type NtSetTimerResolutionFn = unsafe extern "system" fn(
    DesiredResolution: u32,
    SetResolution: bool,
    CurrentResolution: *mut u32,
) -> NTSTATUS;

type NtQueryTimerResolutionFn = unsafe extern "system" fn(
    MinimumResolution: *mut u32,
    MaximumResolution: *mut u32,
    CurrentResolution: *mut u32,
) -> NTSTATUS;

pub struct TimerResolutionManager {
    original_resolution: Option<u32>,
    nt_set_timer_resolution: Option<NtSetTimerResolutionFn>,
    nt_query_timer_resolution: Option<NtQueryTimerResolutionFn>,
}

impl TimerResolutionManager {
    pub fn new() -> Result<Self, String> {
        unsafe {
            let ntdll = windows_sys::Win32::System::LibraryLoader::LoadLibraryA(
                b"ntdll.dll\0".as_ptr()
            );
            if ntdll == 0 {
                return Err("Failed to load ntdll.dll".to_string());
            }

            let set_fn = windows_sys::Win32::System::LibraryLoader::GetProcAddress(
                ntdll,
                b"NtSetTimerResolution\0".as_ptr()
            );
            let query_fn = windows_sys::Win32::System::LibraryLoader::GetProcAddress(
                ntdll,
                b"NtQueryTimerResolution\0".as_ptr()
            );

            if set_fn.is_none() || query_fn.is_none() {
                return Err("Failed to get NTAPI function pointers".to_string());
            }

            Ok(Self {
                original_resolution: None,
                nt_set_timer_resolution: std::mem::transmute(set_fn),
                nt_query_timer_resolution: std::mem::transmute(query_fn),
            })
        }
    }

    pub fn set_resolution(&mut self, resolution_us: u32) -> Result<u32, String> {
        // 1. Query current resolution
        let mut current = 0u32;
        unsafe {
            let query_fn = self.nt_query_timer_resolution.unwrap();
            let mut min = 0u32;
            let mut max = 0u32;
            let status = query_fn(&mut min, &mut max, &mut current);
            if status != 0 {
                return Err(format!("NtQueryTimerResolution failed: {}", status));
            }
        }

        // 2. Save original if first call
        if self.original_resolution.is_none() {
            self.original_resolution = Some(current);
        }

        // 3. Set new resolution (convert microseconds to 100-nanosecond units)
        let desired_100ns = resolution_us * 10;
        unsafe {
            let set_fn = self.nt_set_timer_resolution.unwrap();
            let status = set_fn(desired_100ns, true, &mut current);
            if status != 0 {
                return Err(format!("NtSetTimerResolution failed: {}", status));
            }
        }

        Ok(current / 10) // Return in microseconds
    }

    pub fn restore_original(&mut self) -> Result<(), String> {
        if let Some(original) = self.original_resolution {
            unsafe {
                let set_fn = self.nt_set_timer_resolution.unwrap();
                let mut current = 0u32;
                let status = set_fn(original, true, &mut current);
                if status != 0 {
                    return Err(format!("Failed to restore timer resolution: {}", status));
                }
            }
            self.original_resolution = None;
        }
        Ok(())
    }
}

impl Drop for TimerResolutionManager {
    fn drop(&mut self) {
        let _ = self.restore_original();
        log::info!("Timer resolution restored on drop");
    }
}
```

## Tauri Commands
```rust
// src-tauri/src/modules/memory_orchestrator/mod.rs
#[tauri::command]
pub fn purge_memory_manual() -> Result<u64, String> {
    let mut purger = MEMORY_PURGER.lock().unwrap();
    purger.purge_standby_list()
}

#[tauri::command]
pub fn set_auto_purge_config(config: AutoPurgeConfig) -> Result<(), String> {
    AUTO_PURGE_SERVICE.lock().unwrap().update_config(config);
    Ok(())
}

#[tauri::command]
pub fn start_auto_purge() -> Result<(), String> {
    AUTO_PURGE_SERVICE.lock().unwrap().start()
}

#[tauri::command]
pub fn stop_auto_purge() -> Result<(), String> {
    AUTO_PURGE_SERVICE.lock().unwrap().stop();
    Ok(())
}

#[tauri::command]
pub fn set_timer_resolution(resolution_us: u32) -> Result<u32, String> {
    TIMER_RESOLUTION_MANAGER.lock().unwrap().set_resolution(resolution_us)
}

#[tauri::command]
pub fn restore_timer_resolution() -> Result<(), String> {
    TIMER_RESOLUTION_MANAGER.lock().unwrap().restore_original()
}
```


## Test Plan

### Unit Tests (Rust)
1. **NTAPI Wrapper Tests**:
   - [ ] `test_privilege_check_before_purge()` - Verify admin check
   - [ ] `test_purge_returns_freed_memory()` - Freed MB > 0
   - [ ] `test_purge_rate_limiting()` - Cannot purge twice dalam 1 detik
   - [ ] `test_error_handling_no_admin()` - Return error jika not admin

2. **Auto-Purge Service Tests**:
   - [ ] `test_auto_purge_disabled_by_default()` - Default config enabled = false
   - [ ] `test_auto_purge_triggers_at_threshold()` - Mock standby >= threshold
   - [ ] `test_auto_purge_respects_interval()` - Check only setiap interval
   - [ ] `test_auto_purge_shutdown_graceful()` - Stop() works without panic

3. **Timer Resolution Tests**:
   - [ ] `test_timer_resolution_query()` - Query current resolution success
   - [ ] `test_timer_resolution_set()` - Set ke 5000us (0.5ms)
   - [ ] `test_timer_resolution_restore()` - Restore original on drop
   - [ ] `test_timer_resolution_invalid_value()` - Handle out-of-range values

### Integration Tests
1. **Memory Purge Integration**:
   - [ ] Manual purge via Tauri command dari frontend
   - [ ] Verify freed memory reflected di dashboard stats
   - [ ] Test error propagation ke frontend (permission denied)

2. **Auto-Purge Integration**:
   - [ ] Enable auto-purge, set threshold 2GB, monitor 10 minutes
   - [ ] Verify purge triggers when standby > threshold
   - [ ] Test config update during runtime (change threshold)

3. **Timer Resolution Integration**:
   - [ ] Set timer resolution via frontend
   - [ ] Query via `NtQueryTimerResolution` untuk verify
   - [ ] Close app dan verify restoration via external tool (ClockRes)

### Manual Tests (Pre-UI Implementation)
1. [ ] Run as Admin, invoke `purge_memory_manual()`, check Task Manager standby list
2. [ ] Start auto-purge dengan threshold 2GB, fill RAM with Chrome tabs
3. [ ] Set timer resolution 5000us, verify dengan ClockRes tool dari Sysinternals
4. [ ] Test cleanup on app crash (kill process) - timer should restore

## Error Handling Patterns

### NTAPI-Specific Errors
```rust
// src-tauri/src/utils/error_handler.rs
pub enum NtApiError {
    PermissionDenied,
    InvalidParameter,
    NotSupported,
    Unknown(i32),
}

impl From<i32> for NtApiError {
    fn from(status: i32) -> Self {
        match status as u32 {
            0xC0000061 => NtApiError::NotSupported, // STATUS_PRIVILEGE_NOT_HELD
            0xC000000D => NtApiError::InvalidParameter,
            _ => NtApiError::Unknown(status),
        }
    }
}

impl std::fmt::Display for NtApiError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Self::PermissionDenied => write!(f, "Permission denied - run as Administrator"),
            Self::InvalidParameter => write!(f, "Invalid parameter passed to NTAPI"),
            Self::NotSupported => write!(f, "Operation not supported on this Windows version"),
            Self::Unknown(code) => write!(f, "NTAPI error code: 0x{:X}", code),
        }
    }
}
```

### Retry Strategy
- **Memory Purge**: No retry (user must invoke again)
- **Timer Resolution**: Retry 3x dengan exponential backoff jika transient error
- **Auto-Purge Service**: Log error dan continue (don't crash service)

## Safety Considerations
1. **Memory Purge**: Safe untuk gaming/daily use, tetapi dapat menyebabkan brief stutter
2. **Timer Resolution**: Dapat increase power consumption (CPU tidak sleep deeply)
3. **Admin Requirement**: Mandatory - show UAC prompt on app launch
4. **Windows Version**: Test pada Windows 10 (1909+) dan Windows 11

## Frontend UI Component
```javascript
// src/components/MemoryControl.jsx
import { invoke } from '@tauri-apps/api/tauri';

export function MemoryControl() {
  const [purging, setPurging] = useState(false);
  const [freedMB, setFreedMB] = useState(0);
  const [autoPurgeEnabled, setAutoPurgeEnabled] = useState(false);
  const [threshold, setThreshold] = useState(4096);

  const handleManualPurge = async () => {
    setPurging(true);
    try {
      const freed = await invoke('purge_memory_manual');
      setFreedMB(freed);
      toast.success(`Freed ${freed} MB`);
    } catch (err) {
      toast.error(err);
    } finally {
      setPurging(false);
    }
  };

  const handleAutoToggle = async (enabled) => {
    try {
      if (enabled) {
        await invoke('set_auto_purge_config', { 
          config: { enabled: true, threshold_mb: threshold, check_interval_ms: 5000 }
        });
        await invoke('start_auto_purge');
      } else {
        await invoke('stop_auto_purge');
      }
      setAutoPurgeEnabled(enabled);
    } catch (err) {
      toast.error(err);
    }
  };

  // Render button + settings panel
}
```
