# Module 3: Windows Core & CPU Tweaker

## Description
CPU affinity management, power plan switching, dan service control untuk optimasi performa Windows.

## Dependencies
- **External Crates**: `windows-sys`, `winreg`, `wmi`
- **Internal Modules**: `utils::privilege_check`, `utils::error_handler`

## Core Features

### 1. CPU Core Affinity Assignment
**Purpose**: Assign specific CPU cores ke process tertentu (game process, streaming app, background service)

**Win32 API**: `SetProcessAffinityMask`, `GetProcessAffinityMask`

**Rust Implementation**:
```rust
// src-tauri/src/modules/windows_tweaker/cpu_affinity.rs
use windows_sys::Win32::System::Threading::{
    OpenProcess, SetProcessAffinityMask, GetProcessAffinityMask,
    PROCESS_QUERY_INFORMATION, PROCESS_SET_INFORMATION,
};

pub struct AffinityManager;

impl AffinityManager {
    pub fn set_process_affinity(pid: u32, core_mask: usize) -> Result<(), String> {
        unsafe {
            let handle = OpenProcess(
                PROCESS_QUERY_INFORMATION | PROCESS_SET_INFORMATION,
                false as i32,
                pid,
            );

            if handle == 0 {
                return Err(format!("Failed to open process {}", pid));
            }

            let result = SetProcessAffinityMask(handle, core_mask);
            windows_sys::Win32::Foundation::CloseHandle(handle);

            if result == 0 {
                return Err("Failed to set affinity mask".to_string());
            }
        }

        Ok(())
    }

    pub fn get_process_affinity(pid: u32) -> Result<usize, String> {
        unsafe {
            let handle = OpenProcess(PROCESS_QUERY_INFORMATION, false as i32, pid);
            if handle == 0 {
                return Err(format!("Failed to open process {}", pid));
            }

            let mut process_mask: usize = 0;
            let mut system_mask: usize = 0;
            let result = GetProcessAffinityMask(handle, &mut process_mask, &mut system_mask);
            windows_sys::Win32::Foundation::CloseHandle(handle);

            if result == 0 {
                return Err("Failed to get affinity mask".to_string());
            }

            Ok(process_mask)
        }
    }

    // Helper: Generate mask dari core indices
    // Example: cores=[0, 2, 4] -> mask=0b10101 (21)
    pub fn cores_to_mask(core_indices: &[u32]) -> usize {
        core_indices.iter().fold(0, |mask, &core| mask | (1 << core))
    }

    // Helper: Parse mask ke core indices
    pub fn mask_to_cores(mask: usize) -> Vec<u32> {
        (0..64)
            .filter(|i| (mask & (1 << i)) != 0)
            .collect()
    }
}
```

**Use Cases**:
- **Game + OBS**: Isolate game ke physical cores (0-7), OBS ke logical cores (8-15)
- **CPU-heavy app**: Assign ke P-cores only (Intel 12th gen+)
- **Background service**: Limit ke 2 cores untuk prevent throttling

### 2. Power Plan Switcher
**Purpose**: Switch antara power plan untuk balance vs performance

**Power Plans GUID**:
- Balanced: `381b4222-f694-41f0-9685-ff5bb260df2e`
- High Performance: `8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c`
- Ultimate Performance: `e9a42b02-d5df-448d-aa00-03f14749eb61`

**Rust Implementation**:
```rust
// src-tauri/src/modules/windows_tweaker/power_plan.rs
use std::process::Command;

pub struct PowerPlanManager;

impl PowerPlanManager {
    const ULTIMATE_PERFORMANCE_GUID: &'static str = "e9a42b02-d5df-448d-aa00-03f14749eb61";
    const HIGH_PERFORMANCE_GUID: &'static str = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c";
    const BALANCED_GUID: &'static str = "381b4222-f694-41f0-9685-ff5bb260df2e";

    pub fn get_active_plan() -> Result<String, String> {
        let output = Command::new("powercfg")
            .args(&["/getactivescheme"])
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err("Failed to get active power plan".to_string());
        }

        let output_str = String::from_utf8_lossy(&output.stdout);
        
        // Parse GUID dari output: "Power Scheme GUID: ... (Name)"
        if let Some(guid_start) = output_str.find("GUID: ") {
            let guid_section = &output_str[guid_start + 6..];
            if let Some(guid_end) = guid_section.find(" ") {
                let guid = guid_section[..guid_end].trim();
                return Ok(guid.to_string());
            }
        }

        Err("Failed to parse power plan GUID".to_string())
    }

    pub fn set_power_plan(plan_guid: &str) -> Result<(), String> {
        // Validate GUID format
        if !Self::is_valid_guid(plan_guid) {
            return Err("Invalid GUID format".to_string());
        }

        let output = Command::new("powercfg")
            .args(&["/setactive", plan_guid])
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to set power plan: {}", error));
        }

        Ok(())
    }

    pub fn set_ultimate_performance() -> Result<(), String> {
        // Check if Ultimate Performance exists (Windows 10 Pro+)
        Self::ensure_ultimate_performance_exists()?;
        Self::set_power_plan(Self::ULTIMATE_PERFORMANCE_GUID)
    }

    fn ensure_ultimate_performance_exists() -> Result<(), String> {
        // Ultimate Performance must be duplicated first on most systems
        let output = Command::new("powercfg")
            .args(&["/list"])
            .output()
            .map_err(|e| e.to_string())?;

        let output_str = String::from_utf8_lossy(&output.stdout);
        
        if !output_str.contains(Self::ULTIMATE_PERFORMANCE_GUID) {
            // Duplicate from High Performance
            Command::new("powercfg")
                .args(&[
                    "/duplicatescheme",
                    Self::ULTIMATE_PERFORMANCE_GUID,
                ])
                .output()
                .map_err(|e| format!("Failed to create Ultimate Performance: {}", e))?;
        }

        Ok(())
    }

    fn is_valid_guid(guid: &str) -> bool {
        guid.len() == 36 && guid.chars().filter(|&c| c == '-').count() == 4
    }
}
```


### 3. Service Manager (SysMain, Windows Update)
**Purpose**: Toggle services yang dapat impact performance

**Target Services**:
- **SysMain** (Superfetch): Preload apps ke RAM (can cause disk thrashing)
- **wuauserv** (Windows Update): Background updates (can spike CPU/disk)

**Safety Mechanism**: 
- Confirmation dialog sebelum disable
- Auto-restore on app exit (optional)
- Whitelist only specific services (prevent user mistake)

**Rust Implementation**:
```rust
// src-tauri/src/modules/windows_tweaker/service_manager.rs
use std::process::Command;

#[derive(Debug, Clone)]
pub enum ServiceState {
    Running,
    Stopped,
    Paused,
    Unknown,
}

pub struct ServiceManager;

impl ServiceManager {
    const ALLOWED_SERVICES: &'static [&'static str] = &["SysMain", "wuauserv"];

    pub fn get_service_state(service_name: &str) -> Result<ServiceState, String> {
        // Validate service name against whitelist
        if !Self::ALLOWED_SERVICES.contains(&service_name) {
            return Err(format!("Service '{}' not allowed", service_name));
        }

        let output = Command::new("sc")
            .args(&["query", service_name])
            .output()
            .map_err(|e| e.to_string())?;

        let output_str = String::from_utf8_lossy(&output.stdout);

        if output_str.contains("RUNNING") {
            Ok(ServiceState::Running)
        } else if output_str.contains("STOPPED") {
            Ok(ServiceState::Stopped)
        } else if output_str.contains("PAUSED") {
            Ok(ServiceState::Paused)
        } else {
            Ok(ServiceState::Unknown)
        }
    }

    pub fn stop_service(service_name: &str) -> Result<(), String> {
        if !Self::ALLOWED_SERVICES.contains(&service_name) {
            return Err(format!("Service '{}' not allowed", service_name));
        }

        let output = Command::new("net")
            .args(&["stop", service_name])
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to stop service: {}", error));
        }

        Ok(())
    }

    pub fn start_service(service_name: &str) -> Result<(), String> {
        if !Self::ALLOWED_SERVICES.contains(&service_name) {
            return Err(format!("Service '{}' not allowed", service_name));
        }

        let output = Command::new("net")
            .args(&["start", service_name])
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to start service: {}", error));
        }

        Ok(())
    }

    pub fn set_service_startup(service_name: &str, startup_type: &str) -> Result<(), String> {
        // startup_type: "auto", "demand" (manual), "disabled"
        if !Self::ALLOWED_SERVICES.contains(&service_name) {
            return Err(format!("Service '{}' not allowed", service_name));
        }

        let output = Command::new("sc")
            .args(&["config", service_name, "start=", startup_type])
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err("Failed to configure service startup".to_string());
        }

        Ok(())
    }
}
```

## Tauri Commands
```rust
// src-tauri/src/modules/windows_tweaker/mod.rs

#[tauri::command]
pub fn set_process_affinity(pid: u32, core_indices: Vec<u32>) -> Result<(), String> {
    let mask = AffinityManager::cores_to_mask(&core_indices);
    AffinityManager::set_process_affinity(pid, mask)
}

#[tauri::command]
pub fn get_process_affinity(pid: u32) -> Result<Vec<u32>, String> {
    let mask = AffinityManager::get_process_affinity(pid)?;
    Ok(AffinityManager::mask_to_cores(mask))
}

#[tauri::command]
pub fn get_active_power_plan() -> Result<String, String> {
    PowerPlanManager::get_active_plan()
}

#[tauri::command]
pub fn set_power_plan(plan_guid: String) -> Result<(), String> {
    PowerPlanManager::set_power_plan(&plan_guid)
}

#[tauri::command]
pub fn set_ultimate_performance() -> Result<(), String> {
    PowerPlanManager::set_ultimate_performance()
}

#[tauri::command]
pub fn get_service_state(service_name: String) -> Result<String, String> {
    let state = ServiceManager::get_service_state(&service_name)?;
    Ok(format!("{:?}", state))
}

#[tauri::command]
pub fn toggle_service(service_name: String, enable: bool) -> Result<(), String> {
    if enable {
        ServiceManager::start_service(&service_name)
    } else {
        ServiceManager::stop_service(&service_name)
    }
}
```

## Test Plan

### Unit Tests (Rust)
1. **CPU Affinity Tests**:
   - [ ] `test_cores_to_mask_conversion()` - [0,2,4] -> 0b10101
   - [ ] `test_mask_to_cores_conversion()` - 0b10101 -> [0,2,4]
   - [ ] `test_set_affinity_self_process()` - Set affinity untuk current process
   - [ ] `test_get_affinity_returns_valid_mask()` - Mask > 0

2. **Power Plan Tests**:
   - [ ] `test_get_active_plan_returns_guid()` - GUID format valid
   - [ ] `test_set_power_plan_balanced()` - Switch ke Balanced
   - [ ] `test_ultimate_performance_creation()` - Duplicate jika tidak ada
   - [ ] `test_invalid_guid_rejected()` - Return error untuk invalid GUID

3. **Service Manager Tests**:
   - [ ] `test_service_whitelist_enforced()` - Reject unlisted service
   - [ ] `test_get_service_state_sysmain()` - Query SysMain state
   - [ ] `test_stop_start_cycle()` - Stop -> verify stopped -> Start
   - [ ] `test_service_not_found_error()` - Handle non-existent service

### Integration Tests
1. **Affinity Integration**:
   - [ ] Launch test process, set affinity, verify via Task Manager
   - [ ] Test dengan game process (manual: launch game, get PID, set affinity)

2. **Power Plan Integration**:
   - [ ] Set Ultimate Performance, verify via `powercfg /getactivescheme`
   - [ ] Measure CPU frequency change (should boost higher)

3. **Service Integration**:
   - [ ] Toggle SysMain, verify state change
   - [ ] Test confirmation dialog flow (manual UI test)

### Manual Tests (Pre-UI Implementation)
1. [ ] Run cargo test untuk semua unit tests
2. [ ] Set process affinity untuk Notepad.exe (PID dari Task Manager)
3. [ ] Switch power plan ke Ultimate Performance, check battery drain increase
4. [ ] Stop SysMain, check service status via `sc query SysMain`


## Frontend UI Components

### CPU Tweaker Component
```javascript
// src/components/CPUTweaker.jsx
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export function CPUTweaker() {
  const [processes, setProcesses] = useState([]);
  const [selectedPID, setSelectedPID] = useState(null);
  const [selectedCores, setSelectedCores] = useState([]);
  const [activePowerPlan, setActivePowerPlan] = useState('');

  // Process list (from WMI or enumerate via Rust)
  useEffect(() => {
    // Load running processes
  }, []);

  const handleSetAffinity = async () => {
    try {
      await invoke('set_process_affinity', {
        pid: selectedPID,
        coreIndices: selectedCores,
      });
      toast.success('Affinity set successfully');
    } catch (err) {
      toast.error(err);
    }
  };

  const handlePowerPlanChange = async (planGuid) => {
    try {
      await invoke('set_power_plan', { planGuid });
      setActivePowerPlan(planGuid);
      toast.success('Power plan changed');
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <div>
      {/* Process selector + core affinity UI */}
      {/* Power plan radio buttons */}
    </div>
  );
}
```

### Service Toggle Component
```javascript
// src/components/ServiceToggle.jsx
export function ServiceToggle({ serviceName, displayName }) {
  const [state, setState] = useState('Unknown');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchState = async () => {
      const result = await invoke('get_service_state', { serviceName });
      setState(result);
    };
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [serviceName]);

  const handleToggle = async () => {
    // Show confirmation dialog
    const confirmed = await showConfirmDialog({
      title: 'Confirm Service Change',
      message: `Are you sure you want to ${state === 'Running' ? 'stop' : 'start'} ${displayName}?`,
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      await invoke('toggle_service', {
        serviceName,
        enable: state !== 'Running',
      });
      toast.success('Service state changed');
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded">
      <div>
        <h3 className="font-semibold">{displayName}</h3>
        <p className="text-sm text-gray-500">Status: {state}</p>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`px-4 py-2 rounded ${
          state === 'Running' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}
      >
        {state === 'Running' ? 'Stop' : 'Start'}
      </button>
    </div>
  );
}
```

## Error Handling

### Privilege Escalation Required
```rust
// Setiap command harus check admin sebelum execute
fn check_admin_or_error() -> Result<(), String> {
    if !crate::utils::privilege_check::is_elevated() {
        return Err("This operation requires Administrator privileges. Please restart the app as Admin.".to_string());
    }
    Ok(())
}
```

### Service Operation Errors
- Service not found: "Service '{name}' does not exist"
- Access denied: "Permission denied - run as Administrator"
- Service dependencies: "Cannot stop service - other services depend on it"

### Power Plan Errors
- Invalid GUID: "Invalid power plan GUID format"
- Plan not found: "Power plan does not exist on this system"
- Ultimate Performance unavailable: "Ultimate Performance requires Windows 10 Pro/Enterprise"

## Safety Considerations

### CPU Affinity
- **Risk**: Setting invalid affinity (0 cores) akan crash process
- **Mitigation**: Validate mask > 0 sebelum call SetProcessAffinityMask
- **Revert**: User must manually reset via Task Manager jika needed

### Power Plan
- **Risk**: Ultimate Performance increase power consumption 10-20%
- **Mitigation**: Show warning message tentang battery impact
- **Revert**: App dapat auto-restore ke Balanced on exit (optional setting)

### Service Toggling
- **Risk**: Disabling critical service dapat break Windows
- **Mitigation**: Whitelist only safe-to-disable services
- **Revert**: Auto-restart disabled services on app exit (configurable)

## Performance Benchmarks (Expected)

### CPU Affinity Impact
- Game FPS: +5-10% (isolate game dari background noise)
- Streaming: -30% encoding CPU spikes (dedicated encoder cores)

### Power Plan Impact
- Balanced -> Ultimate Performance: +3-8% CPU benchmark scores
- Battery life: -15-25% runtime on laptop

### Service Disabling Impact
- SysMain disabled: -200-500 MB RAM usage, -10% disk I/O
- wuauserv disabled: -50 MB RAM, -5% CPU during peak hours
