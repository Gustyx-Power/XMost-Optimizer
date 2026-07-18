---
inclusion: auto
---

# Rust Modular Structure Pattern

## Overview
XMOST-OPTIMIZER menggunakan modular architecture dengan 1 module per fitur utama. Steering ini define struktur folder, module exports, dan dependency management.

## Directory Structure

```
src-tauri/src/
├── main.rs                      # Entry point, Tauri setup
├── lib.rs                       # Library root, module exports
├── modules/                     # Feature modules
│   ├── mod.rs                   # Module registry
│   ├── dashboard/               # Module 1: System monitoring
│   │   ├── mod.rs               # Public API, Tauri commands
│   │   ├── wmi_provider.rs      # WMI query layer
│   │   ├── system_info.rs       # Hardware detection
│   │   └── realtime_monitor.rs  # Polling loop
│   ├── memory_orchestrator/     # Module 2: Memory management
│   │   ├── mod.rs
│   │   ├── ntapi_wrapper.rs     # NTAPI bindings
│   │   ├── purge_engine.rs      # Purge logic
│   │   └── timer_resolution.rs  # Timer resolution
│   ├── windows_tweaker/         # Module 3: CPU & Windows
│   │   ├── mod.rs
│   │   ├── cpu_affinity.rs      # Process affinity
│   │   ├── power_plan.rs        # Power plans
│   │   └── service_manager.rs   # Service control
│   ├── gpu_bridge/              # Module 4: GPU control
│   │   ├── mod.rs
│   │   ├── registry_ops.rs      # HAGS registry
│   │   ├── nvidia_api.rs        # NVML wrapper
│   │   └── amd_api.rs           # ADL wrapper
│   └── smart_advisor/           # Module 5: AI recommendations
│       ├── mod.rs
│       ├── metrics_collector.rs # Aggregate metrics
│       ├── ai_client.rs         # Gemini/Groq API
│       └── recommendation_parser.rs
├── utils/                       # Shared utilities
│   ├── mod.rs
│   ├── privilege_check.rs       # Admin detection
│   ├── error_handler.rs         # Error types
│   ├── ntapi_safe.rs            # NTAPI wrapper
│   ├── retry.rs                 # Retry logic
│   └── windows_version.rs       # OS version detection
└── types/                       # Shared type definitions
    ├── mod.rs
    ├── errors.rs                # Error enums
    ├── ntstatus.rs              # NTSTATUS codes
    └── system_info.rs           # Data structures
```

## Module Pattern

### mod.rs Structure
Setiap module harus follow pattern ini:

```rust
// src-tauri/src/modules/example_module/mod.rs

// 1. Private submodules
mod internal_logic;
mod helper_functions;

// 2. Public submodules (if needed)
pub mod public_api;

// 3. Re-exports untuk clean API
pub use internal_logic::MainStruct;
pub use helper_functions::HelperTrait;

// 4. Tauri commands (always pub)
#[tauri::command]
pub fn module_command_1() -> Result<String, String> {
    // Implementation
    Ok("success".to_string())
}

#[tauri::command]
pub fn module_command_2(param: i32) -> Result<(), String> {
    // Implementation
    Ok(())
}

// 5. Public API functions (untuk internal use)
pub fn internal_api_function() -> Result<(), String> {
    // Implementation
    Ok(())
}

// 6. Unit tests
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_module_functionality() {
        // Test implementation
    }
}
```

## Module Registry

### modules/mod.rs
Central registry untuk all modules:

```rust
// src-tauri/src/modules/mod.rs

pub mod dashboard;
pub mod memory_orchestrator;
pub mod windows_tweaker;
pub mod gpu_bridge;
pub mod smart_advisor;

// Re-export commonly used types
pub use dashboard::{HardwareInfo, MemoryStats, TemperatureData};
pub use memory_orchestrator::{AutoPurgeConfig};
pub use windows_tweaker::{AffinityManager, PowerPlanManager};
pub use gpu_bridge::{GpuVendor, GpuBridge};
pub use smart_advisor::{AdvisorResponse, Recommendation};
```

## lib.rs Pattern

### Library Root
```rust
// src-tauri/src/lib.rs

// Public modules
pub mod modules;
pub mod utils;
pub mod types;

// Re-export untuk easier imports
pub use modules::*;
pub use utils::privilege_check::PrivilegeChecker;
pub use types::errors::NtApiError;

// Global state (if needed)
use std::sync::Mutex;
use once_cell::sync::Lazy;

// Example: Global GPU bridge instance
pub static GPU_BRIDGE: Lazy<Mutex<modules::gpu_bridge::GpuBridge>> = Lazy::new(|| {
    Mutex::new(modules::gpu_bridge::GpuBridge::new())
});

// Example: Global AI client
pub static AI_CLIENT: Lazy<Mutex<modules::smart_advisor::AiClient>> = Lazy::new(|| {
    Mutex::new(modules::smart_advisor::AiClient::new(
        String::new(), // API key loaded later
        "gemini".to_string(),
    ))
});
```

## main.rs Pattern

### Tauri Entry Point
```rust
// src-tauri/src/main.rs

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use xmost_optimizer::utils::privilege_check::PrivilegeChecker;

fn main() {
    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .init();

    // CRITICAL: Check admin privileges
    PrivilegeChecker::require_elevation_or_exit();

    // Build Tauri app
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Module 1: Dashboard
            xmost_optimizer::modules::dashboard::get_system_info,
            xmost_optimizer::modules::dashboard::get_memory_stats,
            xmost_optimizer::modules::dashboard::get_temperatures,
            
            // Module 2: Memory Orchestrator
            xmost_optimizer::modules::memory_orchestrator::purge_memory_manual,
            xmost_optimizer::modules::memory_orchestrator::set_auto_purge_config,
            xmost_optimizer::modules::memory_orchestrator::start_auto_purge,
            xmost_optimizer::modules::memory_orchestrator::stop_auto_purge,
            xmost_optimizer::modules::memory_orchestrator::set_timer_resolution,
            xmost_optimizer::modules::memory_orchestrator::restore_timer_resolution,
            
            // Module 3: Windows Tweaker
            xmost_optimizer::modules::windows_tweaker::set_process_affinity,
            xmost_optimizer::modules::windows_tweaker::get_process_affinity,
            xmost_optimizer::modules::windows_tweaker::get_active_power_plan,
            xmost_optimizer::modules::windows_tweaker::set_power_plan,
            xmost_optimizer::modules::windows_tweaker::set_ultimate_performance,
            xmost_optimizer::modules::windows_tweaker::get_service_state,
            xmost_optimizer::modules::windows_tweaker::toggle_service,
            
            // Module 4: GPU Bridge
            xmost_optimizer::modules::gpu_bridge::get_hags_state,
            xmost_optimizer::modules::gpu_bridge::set_hags_state,
            xmost_optimizer::modules::gpu_bridge::get_gpu_vendor,
            xmost_optimizer::modules::gpu_bridge::set_gpu_performance_mode,
            xmost_optimizer::modules::gpu_bridge::get_nvidia_clocks,
            
            // Module 5: Smart Advisor
            xmost_optimizer::modules::smart_advisor::get_smart_recommendations,
            xmost_optimizer::modules::smart_advisor::set_ai_config,
            
            // Utils
            xmost_optimizer::utils::privilege_check::is_elevated,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Dependency Management

### Cargo.toml Organization
```toml
[package]
name = "xmost-optimizer"
version = "0.1.0"
edition = "2021"

[dependencies]
# Tauri core
tauri = { version = "1.5", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Async runtime
tokio = { version = "1", features = ["full"] }

# Windows API
windows-sys = { version = "0.52", features = [
    "Win32_Foundation",
    "Win32_System_Threading",
    "Win32_System_SystemInformation",
    "Win32_Security",
    "Win32_System_LibraryLoader",
] }
winapi = { version = "0.3", features = ["winnt", "processthreadsapi"] }
winreg = "0.52"

# WMI queries
wmi = "0.13"
sysinfo = "0.30"

# GPU APIs
nvml-wrapper = { version = "0.9", optional = true }
libloading = "0.8"

# HTTP client for AI APIs
reqwest = { version = "0.11", features = ["json"] }

# Error handling
thiserror = "1.0"

# Logging
log = "0.4"
env_logger = "0.11"

# Global state
once_cell = "1.19"

[build-dependencies]
tauri-build = { version = "1.5" }

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
nvidia-support = ["nvml-wrapper"]

[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "z"
strip = true
```

## Inter-Module Communication

### Pattern 1: Direct Function Calls
```rust
// Module A calls Module B directly
use crate::modules::dashboard;

pub fn function_in_module_a() -> Result<(), String> {
    let memory_stats = dashboard::get_memory_stats()?;
    // Use memory_stats
    Ok(())
}
```

### Pattern 2: Shared State via Global Statics
```rust
// Both modules access global state
use crate::GPU_BRIDGE;

pub fn function_using_gpu_bridge() -> Result<(), String> {
    let bridge = GPU_BRIDGE.lock().unwrap();
    bridge.set_performance_mode("max_performance")?;
    Ok(())
}
```

### Pattern 3: Event Bus (Future Enhancement)
```rust
// For decoupled communication (not implemented yet)
pub enum SystemEvent {
    MemoryPurged { freed_mb: u64 },
    PowerPlanChanged { plan_guid: String },
}

pub static EVENT_BUS: Lazy<Mutex<Vec<SystemEvent>>> = Lazy::new(|| {
    Mutex::new(Vec::new())
});
```

## Testing Strategy

### Unit Tests (Per Module)
```rust
// tests/module_tests.rs

#[cfg(test)]
mod dashboard_tests {
    use xmost_optimizer::modules::dashboard::*;

    #[test]
    fn test_hardware_detection() {
        let result = get_hardware_info();
        assert!(result.is_ok());
    }
}
```

### Integration Tests
```rust
// tests/integration_tests.rs

use xmost_optimizer::modules::*;

#[tokio::test]
async fn test_memory_purge_workflow() {
    // Test cross-module interaction
    let before = dashboard::get_memory_stats().unwrap();
    memory_orchestrator::purge_memory_manual().unwrap();
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    let after = dashboard::get_memory_stats().unwrap();
    
    assert!(after.standby_mb < before.standby_mb);
}
```

## Build Scripts

### Development Build
```bash
# Development dengan hot reload
cargo tauri dev

# Development dengan specific features
cargo tauri dev --features nvidia-support
```

### Production Build
```bash
# Release build dengan optimizations
cargo tauri build --release

# Build untuk specific target
cargo tauri build --target x86_64-pc-windows-msvc
```

## Code Style Guidelines

### Naming Conventions
- **Modules**: `snake_case` (e.g., `memory_orchestrator`)
- **Files**: `snake_case` (e.g., `ntapi_wrapper.rs`)
- **Structs**: `PascalCase` (e.g., `AffinityManager`)
- **Functions**: `snake_case` (e.g., `get_hardware_info`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `SYSTEM_MEMORY_LIST_INFORMATION`)
- **Tauri Commands**: `snake_case` (e.g., `purge_memory_manual`)

### Documentation
```rust
/// Brief description of function
///
/// # Arguments
/// * `param1` - Description of param1
/// * `param2` - Description of param2
///
/// # Returns
/// * `Ok(T)` - Success case
/// * `Err(String)` - Error case with message
///
/// # Examples
/// ```
/// let result = function_name(123, "test")?;
/// ```
pub fn function_name(param1: i32, param2: &str) -> Result<String, String> {
    // Implementation
}
```

## Import Organization

### Standard Import Order
```rust
// 1. std imports
use std::sync::Mutex;
use std::time::Duration;

// 2. External crate imports
use serde::{Deserialize, Serialize};
use tokio::time::sleep;

// 3. windows-sys imports
use windows_sys::Win32::Foundation::HANDLE;
use windows_sys::Win32::System::Threading::*;

// 4. crate-internal imports
use crate::types::errors::NtApiError;
use crate::utils::privilege_check::PrivilegeChecker;

// 5. module-internal imports
use super::helper_module::HelperStruct;
```
