# Module 1: Dashboard & System Monitor

## Description
Real-time system monitoring dashboard dengan polling WMI data untuk hardware identity dan performance metrics.

## Dependencies
- **External Crates**: `wmi`, `sysinfo`, `tokio`, `serde`
- **Internal Modules**: None (foundation module)

## Data Flow Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    WMI Query Layer                          │
│  (Win32_Processor, Win32_VideoController, Win32_BaseBoard)  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Rust Backend Structs                           │
│  SystemInfo { cpu_name, gpu_name, motherboard, ... }        │
│  MemoryStats { total, used, standby, available, ... }       │
│  TemperatureData { cpu_temp, gpu_temp }                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              IPC Bridge (Tauri Commands)                    │
│  #[tauri::command] get_system_info()                        │
│  #[tauri::command] get_memory_stats()                       │
│  #[tauri::command] get_temperatures()                       │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              React State Management                         │
│  useState + useEffect (polling interval: 1000ms)            │
│  Context: SystemMonitorContext                              │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              UI Components                                  │
│  Dashboard.jsx (main container)                             │
│  SystemInfoCard, MemoryGauge, TemperatureChart             │
└─────────────────────────────────────────────────────────────┘
```

## Core Features

### 1. Hardware Identity Detection (Static Data)
**WMI Queries**:
- `Win32_Processor`: CPU name, core count, thread count
- `Win32_VideoController`: GPU name, driver version, VRAM
- `Win32_BaseBoard`: Motherboard manufacturer, product name

**Rust Implementation**:
```rust
// src-tauri/src/modules/dashboard/wmi_provider.rs
pub struct HardwareInfo {
    pub cpu_name: String,
    pub cpu_cores: u32,
    pub cpu_threads: u32,
    pub gpu_name: String,
    pub gpu_vram_mb: u64,
    pub motherboard: String,
}

pub fn get_hardware_info() -> Result<HardwareInfo, Box<dyn std::error::Error>>;
```

### 2. Real-Time Memory Monitoring (Dynamic Polling)
**Data Points**:
- Total Physical Memory (MB)
- Used Memory (MB)
- Standby List Size (MB) - from `Win32_PerfFormattedData_PerfOS_Memory`
- Available Memory (MB)
- Memory Usage Percentage

**Polling Interval**: 1000ms (configurable)

**Rust Implementation**:
```rust
// src-tauri/src/modules/dashboard/realtime_monitor.rs
pub struct MemoryStats {
    pub total_mb: u64,
    pub used_mb: u64,
    pub standby_mb: u64,
    pub available_mb: u64,
    pub usage_percent: f32,
}

pub fn get_memory_stats() -> Result<MemoryStats, Box<dyn std::error::Error>>;
```

### 3. Temperature Monitoring
**Data Sources**:
- CPU Temp: WMI `Win32_TemperatureProbe` atau LibreHardwareMonitor integration
- GPU Temp: NVML (NVIDIA) atau ADL (AMD) via GPU vendor SDKs

**Fallback Strategy**: Jika vendor SDK tidak tersedia, return `None`

**Rust Implementation**:
```rust
pub struct TemperatureData {
    pub cpu_temp_celsius: Option<f32>,
    pub gpu_temp_celsius: Option<f32>,
}

pub fn get_temperatures() -> Result<TemperatureData, Box<dyn std::error::Error>>;
```

## Tauri Commands
```rust
// src-tauri/src/modules/dashboard/mod.rs
#[tauri::command]
pub fn get_system_info() -> Result<HardwareInfo, String>;

#[tauri::command]
pub fn get_memory_stats() -> Result<MemoryStats, String>;

#[tauri::command]
pub fn get_temperatures() -> Result<TemperatureData, String>;
```


## Frontend Implementation

### React Hook: `useSystemMonitor`
```javascript
// src/hooks/useSystemMonitor.js
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export function useSystemMonitor(pollInterval = 1000) {
  const [systemInfo, setSystemInfo] = useState(null);
  const [memoryStats, setMemoryStats] = useState(null);
  const [temperatures, setTemperatures] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initial fetch
    invoke('get_system_info').then(setSystemInfo).catch(setError);

    // Polling for dynamic data
    const interval = setInterval(() => {
      invoke('get_memory_stats').then(setMemoryStats).catch(setError);
      invoke('get_temperatures').then(setTemperatures).catch(setError);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval]);

  return { systemInfo, memoryStats, temperatures, error };
}
```

### Dashboard Component
```javascript
// src/components/Dashboard.jsx
import { useSystemMonitor } from '../hooks/useSystemMonitor';

export function Dashboard() {
  const { systemInfo, memoryStats, temperatures, error } = useSystemMonitor();

  // Render UI cards dengan data real-time
}
```

## Test Plan

### Unit Tests (Rust)
1. **WMI Provider Tests**:
   - [ ] `test_get_hardware_info_success()` - Verify WMI query berhasil
   - [ ] `test_hardware_info_contains_cpu_name()` - Validate CPU name tidak kosong
   - [ ] `test_hardware_info_contains_gpu_name()` - Validate GPU name tidak kosong

2. **Memory Stats Tests**:
   - [ ] `test_memory_stats_total_non_zero()` - Total memory > 0
   - [ ] `test_memory_stats_usage_in_range()` - Usage percent 0-100
   - [ ] `test_standby_list_detection()` - Standby list size valid

3. **Temperature Tests**:
   - [ ] `test_temperature_fallback_graceful()` - None value jika SDK tidak ada
   - [ ] `test_temperature_range_valid()` - Temp 0-120°C jika ada

### Integration Tests
1. **Tauri Command Tests**:
   - [ ] Test invoke `get_system_info` dari mock frontend
   - [ ] Test polling 10x `get_memory_stats` tanpa memory leak
   - [ ] Test error handling jika WMI query gagal

### Manual Tests (Pre-UI Implementation)
1. [ ] Run `cargo test` di module dashboard
2. [ ] Build Tauri app dan verify console output untuk system info
3. [ ] Monitor RAM usage selama polling 5 menit (should be stable)
4. [ ] Test pada sistem dengan GPU NVIDIA dan AMD (dual testing)

## Error Handling
- WMI query timeout: Return error dengan message "Failed to query WMI"
- Permission denied: Return error "Administrator privileges required"
- Invalid data: Return default/fallback values dengan warning log

## Performance Considerations
- WMI query caching untuk static data (hardware info)
- Polling interval configurable via settings
- Background thread untuk polling agar tidak block UI
- Memory pool limit untuk historical data (max 1000 samples)
