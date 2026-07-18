# Module 4: GPU Control Bridge

## Description
GPU configuration layer dengan registry operations untuk HAGS dan vendor-specific API untuk NVIDIA/AMD power profiles.

## Dependencies
- **External Crates**: `winreg`, `nvml-wrapper` (NVIDIA), Custom AMD ADL bindings
- **Internal Modules**: `utils::privilege_check`, `modules::dashboard` (GPU detection)

## Core Features

### 1. Hardware-Accelerated GPU Scheduling (HAGS)
**Purpose**: Toggle Windows 10/11 HAGS feature via registry

**Registry Path**: 
```
HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\GraphicsDrivers
Key: HwSchMode
Value: 1 (enabled) or 2 (disabled)
```

**Requirements**: Requires reboot untuk apply changes

**Rust Implementation**:
```rust
// src-tauri/src/modules/gpu_bridge/registry_ops.rs
use winreg::enums::*;
use winreg::RegKey;

pub struct HagsManager;

impl HagsManager {
    const REGISTRY_PATH: &'static str = r"SYSTEM\CurrentControlSet\Control\GraphicsDrivers";
    const REGISTRY_KEY: &'static str = "HwSchMode";

    pub fn is_hags_supported() -> Result<bool, String> {
        // Check Windows version (requires Win10 2004+)
        // Check GPU driver support (WDDM 2.7+)
        Ok(true) // Simplified - implement actual check
    }

    pub fn get_hags_state() -> Result<bool, String> {
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let key = hklm
            .open_subkey(Self::REGISTRY_PATH)
            .map_err(|e| format!("Failed to open registry key: {}", e))?;

        let value: u32 = key
            .get_value(Self::REGISTRY_KEY)
            .unwrap_or(2); // Default: disabled

        Ok(value == 1)
    }

    pub fn set_hags_state(enabled: bool) -> Result<(), String> {
        // Check admin privileges
        if !crate::utils::privilege_check::is_elevated() {
            return Err("Administrator privileges required".to_string());
        }

        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let key = hklm
            .open_subkey_with_flags(Self::REGISTRY_PATH, KEY_WRITE)
            .map_err(|e| format!("Failed to open registry key for write: {}", e))?;

        let value: u32 = if enabled { 1 } else { 2 };
        key.set_value(Self::REGISTRY_KEY, &value)
            .map_err(|e| format!("Failed to set registry value: {}", e))?;

        Ok(())
    }
}
```

### 2. GPU Vendor Detection
**Purpose**: Detect NVIDIA vs AMD untuk route ke correct API

**Detection Strategy**:
1. Query WMI `Win32_VideoController` -> Name
2. Check for "NVIDIA" atau "AMD" / "Radeon" dalam name
3. Fallback: Generic profile (registry-only)

**Rust Implementation**:
```rust
// src-tauri/src/modules/gpu_bridge/mod.rs
#[derive(Debug, Clone, PartialEq)]
pub enum GpuVendor {
    Nvidia,
    Amd,
    Intel,
    Unknown,
}

pub struct GpuDetector;

impl GpuDetector {
    pub fn detect_vendor() -> Result<GpuVendor, String> {
        let hw_info = crate::modules::dashboard::get_hardware_info()
            .map_err(|e| e.to_string())?;

        let gpu_name = hw_info.gpu_name.to_lowercase();

        if gpu_name.contains("nvidia") || gpu_name.contains("geforce") || gpu_name.contains("rtx") {
            Ok(GpuVendor::Nvidia)
        } else if gpu_name.contains("amd") || gpu_name.contains("radeon") {
            Ok(GpuVendor::Amd)
        } else if gpu_name.contains("intel") || gpu_name.contains("uhd") || gpu_name.contains("iris") {
            Ok(GpuVendor::Intel)
        } else {
            Ok(GpuVendor::Unknown)
        }
    }
}
```

### 3. NVIDIA Power Profile API
**Purpose**: Set power management mode via NVML (NVIDIA Management Library)

**Power Modes**:
- Adaptive (default) - Balance performance/power
- Prefer Maximum Performance - Lock clocks high
- Optimal Power - Aggressive power saving

**Rust Implementation**:
```rust
// src-tauri/src/modules/gpu_bridge/nvidia_api.rs
use nvml_wrapper::Nvml;
use nvml_wrapper::enum_wrappers::device::GpuPowerMode;

pub struct NvidiaController {
    nvml: Option<Nvml>,
}

impl NvidiaController {
    pub fn new() -> Self {
        let nvml = match Nvml::init() {
            Ok(n) => {
                log::info!("NVML initialized successfully");
                Some(n)
            }
            Err(e) => {
                log::warn!("Failed to initialize NVML: {}. NVIDIA features disabled.", e);
                None
            }
        };

        Self { nvml }
    }

    pub fn is_available(&self) -> bool {
        self.nvml.is_some()
    }

    pub fn set_power_mode(&self, mode: &str) -> Result<(), String> {
        let nvml = self.nvml.as_ref()
            .ok_or("NVML not available")?;

        let device = nvml.device_by_index(0)
            .map_err(|e| format!("Failed to get GPU device: {}", e))?;

        // Note: NVML power mode control requires specific driver support
        // Alternative: Use nvidia-smi command line
        let command = match mode {
            "max_performance" => "nvidia-smi -pm 1", // Persistence mode
            "adaptive" => "nvidia-smi -pm 0",
            _ => return Err("Invalid power mode".to_string()),
        };

        std::process::Command::new("cmd")
            .args(&["/C", command])
            .output()
            .map_err(|e| format!("Failed to execute nvidia-smi: {}", e))?;

        Ok(())
    }

    pub fn get_current_clocks(&self) -> Result<(u32, u32), String> {
        let nvml = self.nvml.as_ref()
            .ok_or("NVML not available")?;

        let device = nvml.device_by_index(0)
            .map_err(|e| e.to_string())?;

        let gpu_clock = device.clock_info(nvml_wrapper::enum_wrappers::device::Clock::Graphics)
            .map_err(|e| e.to_string())?;

        let mem_clock = device.clock_info(nvml_wrapper::enum_wrappers::device::Clock::Memory)
            .map_err(|e| e.to_string())?;

        Ok((gpu_clock, mem_clock))
    }
}
```


### 4. AMD Power Profile API
**Purpose**: Set AMD GPU power profile via ADL (AMD Display Library)

**Power Profiles**:
- Power Saving
- Balanced (default)
- Performance
- Custom (user-defined clocks)

**ADL Integration Strategy**:
AMD tidak provide Rust crate, gunakan FFI ke `atiadlxx.dll` / `atiadlxy.dll`

**Rust Implementation**:
```rust
// src-tauri/src/modules/gpu_bridge/amd_api.rs
use std::ffi::c_void;
use libloading::{Library, Symbol};

type AdlMainControlCreate = unsafe extern "C" fn(
    callback: *const c_void,
    connector: i32,
) -> i32;

type AdlMainControlDestroy = unsafe extern "C" fn() -> i32;

type AdlOverdrive5PowerControlSet = unsafe extern "C" fn(
    adapter_index: i32,
    power_control_percent: i32,
) -> i32;

pub struct AmdController {
    adl_lib: Option<Library>,
}

impl AmdController {
    pub fn new() -> Self {
        // Try load ADL DLL (64-bit or 32-bit)
        let adl_lib = Self::load_adl_library();
        
        if let Some(ref lib) = adl_lib {
            unsafe {
                if let Ok(create_fn) = lib.get::<Symbol<AdlMainControlCreate>>(b"ADL_Main_Control_Create") {
                    let result = create_fn(std::ptr::null(), 1);
                    if result == 0 {
                        log::info!("ADL initialized successfully");
                    } else {
                        log::warn!("ADL initialization failed with code: {}", result);
                    }
                }
            }
        }

        Self { adl_lib }
    }

    fn load_adl_library() -> Option<Library> {
        // Try 64-bit first, then 32-bit
        unsafe {
            Library::new("atiadlxx.dll")
                .or_else(|_| Library::new("atiadlxy.dll"))
                .ok()
        }
    }

    pub fn is_available(&self) -> bool {
        self.adl_lib.is_some()
    }

    pub fn set_power_limit(&self, percent: i32) -> Result<(), String> {
        let lib = self.adl_lib.as_ref()
            .ok_or("ADL not available")?;

        // Validate range: typically -50 to +50
        if percent < -50 || percent > 50 {
            return Err("Power limit must be between -50% and +50%".to_string());
        }

        unsafe {
            let set_fn: Symbol<AdlOverdrive5PowerControlSet> = lib
                .get(b"ADL_Overdrive5_PowerControl_Set")
                .map_err(|e| format!("Failed to get ADL function: {}", e))?;

            let result = set_fn(0, percent); // Adapter index 0 (primary GPU)
            if result != 0 {
                return Err(format!("ADL power control failed with code: {}", result));
            }
        }

        Ok(())
    }

    // Alternative: Use OverdriveNTool command-line tool
    pub fn set_power_profile_via_tool(&self, profile: &str) -> Result<(), String> {
        // OverdriveNTool.exe -p0Profile0 (Power Saving)
        // OverdriveNTool.exe -p0Profile1 (Balanced)
        // OverdriveNTool.exe -p0Profile2 (Performance)
        
        let profile_arg = match profile {
            "power_saving" => "-p0Profile0",
            "balanced" => "-p0Profile1",
            "performance" => "-p0Profile2",
            _ => return Err("Invalid profile".to_string()),
        };

        let output = std::process::Command::new("OverdriveNTool.exe")
            .arg(profile_arg)
            .output()
            .map_err(|e| format!("Failed to run OverdriveNTool: {}", e))?;

        if !output.status.success() {
            return Err("OverdriveNTool failed".to_string());
        }

        Ok(())
    }
}

impl Drop for AmdController {
    fn drop(&mut self) {
        if let Some(ref lib) = self.adl_lib {
            unsafe {
                if let Ok(destroy_fn) = lib.get::<Symbol<AdlMainControlDestroy>>(b"ADL_Main_Control_Destroy") {
                    destroy_fn();
                    log::info!("ADL destroyed");
                }
            }
        }
    }
}
```

## Unified GPU Bridge Interface
```rust
// src-tauri/src/modules/gpu_bridge/mod.rs
pub struct GpuBridge {
    vendor: GpuVendor,
    nvidia_controller: Option<NvidiaController>,
    amd_controller: Option<AmdController>,
}

impl GpuBridge {
    pub fn new() -> Self {
        let vendor = GpuDetector::detect_vendor().unwrap_or(GpuVendor::Unknown);
        
        let (nvidia_controller, amd_controller) = match vendor {
            GpuVendor::Nvidia => (Some(NvidiaController::new()), None),
            GpuVendor::Amd => (None, Some(AmdController::new())),
            _ => (None, None),
        };

        Self {
            vendor,
            nvidia_controller,
            amd_controller,
        }
    }

    pub fn set_performance_mode(&self, mode: &str) -> Result<(), String> {
        match self.vendor {
            GpuVendor::Nvidia => {
                self.nvidia_controller
                    .as_ref()
                    .ok_or("NVIDIA controller not available")?
                    .set_power_mode(mode)
            }
            GpuVendor::Amd => {
                self.amd_controller
                    .as_ref()
                    .ok_or("AMD controller not available")?
                    .set_power_profile_via_tool(mode)
            }
            _ => Err("GPU vendor not supported".to_string()),
        }
    }

    pub fn get_vendor(&self) -> GpuVendor {
        self.vendor.clone()
    }
}
```

## Tauri Commands
```rust
#[tauri::command]
pub fn get_hags_state() -> Result<bool, String> {
    HagsManager::get_hags_state()
}

#[tauri::command]
pub fn set_hags_state(enabled: bool) -> Result<(), String> {
    HagsManager::set_hags_state(enabled)?;
    Ok(())
}

#[tauri::command]
pub fn get_gpu_vendor() -> Result<String, String> {
    let vendor = GpuDetector::detect_vendor()?;
    Ok(format!("{:?}", vendor))
}

#[tauri::command]
pub fn set_gpu_performance_mode(mode: String) -> Result<(), String> {
    let bridge = GPU_BRIDGE.lock().unwrap();
    bridge.set_performance_mode(&mode)
}

#[tauri::command]
pub fn get_nvidia_clocks() -> Result<(u32, u32), String> {
    let bridge = GPU_BRIDGE.lock().unwrap();
    if let Some(ref nvidia) = bridge.nvidia_controller {
        nvidia.get_current_clocks()
    } else {
        Err("NVIDIA GPU not available".to_string())
    }
}
```


## Test Plan

### Unit Tests (Rust)
1. **HAGS Registry Tests**:
   - [ ] `test_hags_get_state()` - Read registry value
   - [ ] `test_hags_set_enabled()` - Write value = 1
   - [ ] `test_hags_set_disabled()` - Write value = 2
   - [ ] `test_hags_permission_denied()` - Error jika not admin

2. **GPU Detection Tests**:
   - [ ] `test_detect_nvidia_gpu()` - Mock WMI dengan "NVIDIA GeForce RTX"
   - [ ] `test_detect_amd_gpu()` - Mock WMI dengan "AMD Radeon RX"
   - [ ] `test_detect_intel_gpu()` - Mock WMI dengan "Intel UHD Graphics"
   - [ ] `test_detect_unknown_gpu()` - Mock WMI dengan "Unknown GPU"

3. **NVIDIA API Tests** (require NVIDIA GPU):
   - [ ] `test_nvml_init_success()` - NVML library loads
   - [ ] `test_nvidia_get_clocks()` - Return (gpu_clock, mem_clock)
   - [ ] `test_nvidia_set_power_mode()` - No error thrown
   - [ ] `test_nvidia_unavailable_graceful()` - Handle missing driver

4. **AMD API Tests** (require AMD GPU):
   - [ ] `test_adl_library_load()` - DLL loads successfully
   - [ ] `test_amd_set_power_limit()` - Accept -50 to +50 range
   - [ ] `test_amd_invalid_power_limit()` - Reject > 50 or < -50
   - [ ] `test_amd_unavailable_graceful()` - Handle missing ADL

### Integration Tests
1. **HAGS Toggle Integration**:
   - [ ] Set HAGS enabled, verify registry value = 1
   - [ ] Set HAGS disabled, verify registry value = 2
   - [ ] Show reboot reminder in UI

2. **GPU Vendor Integration**:
   - [ ] Detect vendor, show correct power profile options
   - [ ] NVIDIA system: Show "Max Performance", "Adaptive"
   - [ ] AMD system: Show "Performance", "Balanced", "Power Saving"

3. **Power Profile Integration**:
   - [ ] Set NVIDIA max performance, verify via nvidia-smi
   - [ ] Set AMD performance profile, verify via GPU-Z or Radeon Software

### Manual Tests (Multi-GPU Systems)
1. [ ] Test pada sistem dengan NVIDIA GPU (RTX 3060+)
2. [ ] Test pada sistem dengan AMD GPU (RX 6000+)
3. [ ] Test pada sistem dengan Intel iGPU only (expect graceful degradation)
4. [ ] Test HAGS toggle, verify dengan DXDiag atau MSI Afterburner

## Frontend UI Component

```javascript
// src/components/GPUControl.jsx
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export function GPUControl() {
  const [hagsEnabled, setHagsEnabled] = useState(false);
  const [gpuVendor, setGpuVendor] = useState('Unknown');
  const [powerMode, setPowerMode] = useState('balanced');
  const [showRebootWarning, setShowRebootWarning] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const hags = await invoke('get_hags_state');
        setHagsEnabled(hags);

        const vendor = await invoke('get_gpu_vendor');
        setGpuVendor(vendor);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  const handleHagsToggle = async (enabled) => {
    try {
      await invoke('set_hags_state', { enabled });
      setHagsEnabled(enabled);
      setShowRebootWarning(true);
      toast.info('HAGS setting changed. Reboot required to apply.');
    } catch (err) {
      toast.error(err);
    }
  };

  const handlePowerModeChange = async (mode) => {
    try {
      await invoke('set_gpu_performance_mode', { mode });
      setPowerMode(mode);
      toast.success('GPU power mode changed');
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* HAGS Toggle */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Hardware-Accelerated GPU Scheduling</h3>
        <p className="text-sm text-gray-600 mb-4">
          Offload GPU scheduling to hardware (requires WDDM 2.7+ driver)
        </p>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={hagsEnabled}
            onChange={(e) => handleHagsToggle(e.target.checked)}
            className="toggle"
          />
          <span>{hagsEnabled ? 'Enabled' : 'Disabled'}</span>
        </label>
        {showRebootWarning && (
          <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded">
            ⚠️ Reboot required to apply changes
          </div>
        )}
      </div>

      {/* GPU Power Mode */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">GPU Performance Mode</h3>
        <p className="text-sm text-gray-600 mb-4">
          Detected GPU: {gpuVendor}
        </p>

        {gpuVendor === 'Nvidia' && (
          <div className="space-y-2">
            <label>
              <input
                type="radio"
                value="adaptive"
                checked={powerMode === 'adaptive'}
                onChange={(e) => handlePowerModeChange(e.target.value)}
              />
              <span className="ml-2">Adaptive (Balanced)</span>
            </label>
            <label>
              <input
                type="radio"
                value="max_performance"
                checked={powerMode === 'max_performance'}
                onChange={(e) => handlePowerModeChange(e.target.value)}
              />
              <span className="ml-2">Maximum Performance</span>
            </label>
          </div>
        )}

        {gpuVendor === 'Amd' && (
          <div className="space-y-2">
            <label>
              <input
                type="radio"
                value="power_saving"
                checked={powerMode === 'power_saving'}
                onChange={(e) => handlePowerModeChange(e.target.value)}
              />
              <span className="ml-2">Power Saving</span>
            </label>
            <label>
              <input
                type="radio"
                value="balanced"
                checked={powerMode === 'balanced'}
                onChange={(e) => handlePowerModeChange(e.target.value)}
              />
              <span className="ml-2">Balanced</span>
            </label>
            <label>
              <input
                type="radio"
                value="performance"
                checked={powerMode === 'performance'}
                onChange={(e) => handlePowerModeChange(e.target.value)}
              />
              <span className="ml-2">Performance</span>
            </label>
          </div>
        )}

        {(gpuVendor === 'Intel' || gpuVendor === 'Unknown') && (
          <p className="text-gray-500">
            Advanced GPU controls not available for this GPU
          </p>
        )}
      </div>
    </div>
  );
}
```

## Error Handling

### Registry Access Errors
- Permission denied: "Administrator privileges required to modify GPU settings"
- Key not found: "HAGS not supported on this system (requires Windows 10 2004+)"
- Write failed: "Failed to write registry value - check permissions"

### Vendor API Errors
- NVML not found: "NVIDIA drivers not installed or too old (require 418.81+)"
- ADL not found: "AMD drivers not installed or Radeon Software not configured"
- Device not found: "No compatible GPU detected"

## Safety Considerations

### HAGS Toggle
- **Risk**: Dapat cause graphical glitches pada older drivers
- **Mitigation**: Show driver version check, warn if < recommended
- **Revert**: User can toggle back dan reboot

### GPU Power Modes
- **Risk**: Maximum performance mode increase power draw 20-40W
- **Mitigation**: Show power consumption warning
- **Revert**: Auto-restore ke balanced on app exit (optional)

### Multi-GPU Systems
- **Risk**: API calls target GPU 0 (primary), can miss dGPU
- **Mitigation**: Enumerate all GPUs, let user select target
- **Future**: Support multi-GPU profiles

## Performance Impact (Expected)

### HAGS Enabled
- Gaming FPS: +0-5% (minimal, latency improvement lebih significant)
- Input latency: -5-10ms (noticeable in competitive games)
- Power draw: +0-2W (negligible)

### GPU Power Modes
- Adaptive -> Max Performance: +5-15% GPU benchmark scores
- Max Performance power draw: +15-40W depending on GPU model
- Temperature: +5-10°C under load
