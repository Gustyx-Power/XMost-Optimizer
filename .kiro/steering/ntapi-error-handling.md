---
inclusion: auto
---

# NTAPI Error Handling Pattern

## Overview
NTAPI (Native API) adalah undocumented Windows API yang tidak memiliki official error messages atau documentation. Steering ini define robust error handling pattern untuk NTAPI calls.

## NTSTATUS Error Codes

### Common NTSTATUS Values
```rust
// src-tauri/src/types/ntstatus.rs

pub type NTSTATUS = i32;

// Success codes
pub const STATUS_SUCCESS: NTSTATUS = 0x00000000;

// Error codes (common untuk XMOST operations)
pub const STATUS_ACCESS_DENIED: NTSTATUS = 0xC0000022u32 as i32;
pub const STATUS_PRIVILEGE_NOT_HELD: NTSTATUS = 0xC0000061u32 as i32;
pub const STATUS_INVALID_PARAMETER: NTSTATUS = 0xC000000Du32 as i32;
pub const STATUS_NOT_SUPPORTED: NTSTATUS = 0xC00000BBu32 as i32;
pub const STATUS_INVALID_INFO_CLASS: NTSTATUS = 0xC0000003u32 as i32;
pub const STATUS_BUFFER_TOO_SMALL: NTSTATUS = 0xC0000023u32 as i32;
pub const STATUS_UNSUCCESSFUL: NTSTATUS = 0xC0000001u32 as i32;

pub fn is_success(status: NTSTATUS) -> bool {
    status >= 0
}

pub fn is_error(status: NTSTATUS) -> bool {
    status < 0
}
```

## Error Type Definition

### Custom Error Enum
```rust
// src-tauri/src/types/errors.rs

use thiserror::Error;

#[derive(Debug, Error)]
pub enum NtApiError {
    #[error("Permission denied - Administrator privileges required")]
    PermissionDenied,

    #[error("Privilege not held - specific privilege required: {0}")]
    PrivilegeNotHeld(String),

    #[error("Invalid parameter provided to NTAPI function")]
    InvalidParameter,

    #[error("Operation not supported on this Windows version")]
    NotSupported,

    #[error("Invalid information class for NTAPI function")]
    InvalidInfoClass,

    #[error("Buffer too small for NTAPI operation")]
    BufferTooSmall,

    #[error("NTAPI operation failed - NTSTATUS: 0x{0:08X}")]
    Unknown(u32),

    #[error("Library load failed: {0}")]
    LibraryLoadError(String),

    #[error("Function not found in library: {0}")]
    FunctionNotFound(String),
}

impl From<NTSTATUS> for NtApiError {
    fn from(status: NTSTATUS) -> Self {
        match status as u32 {
            0xC0000022 => NtApiError::PermissionDenied,
            0xC0000061 => NtApiError::PrivilegeNotHeld("Unknown".to_string()),
            0xC000000D => NtApiError::InvalidParameter,
            0xC00000BB => NtApiError::NotSupported,
            0xC0000003 => NtApiError::InvalidInfoClass,
            0xC0000023 => NtApiError::BufferTooSmall,
            code => NtApiError::Unknown(code),
        }
    }
}

impl From<NtApiError> for String {
    fn from(err: NtApiError) -> Self {
        err.to_string()
    }
}
```

## Safe NTAPI Call Wrapper

### Generic Wrapper Pattern
```rust
// src-tauri/src/utils/ntapi_safe.rs

use crate::types::errors::NtApiError;
use crate::types::ntstatus::{NTSTATUS, is_success};

/// Wrapper untuk NTAPI calls dengan automatic error conversion
pub fn call_ntapi<F, T>(operation_name: &str, f: F) -> Result<T, NtApiError>
where
    F: FnOnce() -> (NTSTATUS, T),
{
    let (status, result) = f();

    if is_success(status) {
        log::debug!("NTAPI call '{}' succeeded: 0x{:08X}", operation_name, status);
        Ok(result)
    } else {
        log::error!("NTAPI call '{}' failed: 0x{:08X}", operation_name, status);
        Err(NtApiError::from(status))
    }
}

/// Wrapper untuk NTAPI calls tanpa return value
pub fn call_ntapi_void<F>(operation_name: &str, f: F) -> Result<(), NtApiError>
where
    F: FnOnce() -> NTSTATUS,
{
    let status = f();

    if is_success(status) {
        log::debug!("NTAPI call '{}' succeeded", operation_name);
        Ok(())
    } else {
        log::error!("NTAPI call '{}' failed: 0x{:08X}", operation_name, status);
        Err(NtApiError::from(status))
    }
}
```

## Usage Examples

### Memory Purge with Error Handling
```rust
// src-tauri/src/modules/memory_orchestrator/ntapi_wrapper.rs

use crate::utils::ntapi_safe::call_ntapi_void;
use crate::types::errors::NtApiError;

pub fn purge_standby_list() -> Result<(), NtApiError> {
    const SYSTEM_MEMORY_LIST_INFORMATION: u32 = 80;
    const MEMORY_PURGE_STANDBY_LIST: i32 = 4;

    unsafe {
        let command = MEMORY_PURGE_STANDBY_LIST;
        
        call_ntapi_void("NtSetSystemInformation(MemoryPurge)", || {
            NtSetSystemInformation(
                SYSTEM_MEMORY_LIST_INFORMATION,
                &command as *const i32 as *const _,
                std::mem::size_of::<i32>() as u32,
            )
        })
    }
}
```

### Timer Resolution with Error Handling
```rust
pub fn set_timer_resolution(desired_us: u32) -> Result<u32, NtApiError> {
    let desired_100ns = desired_us * 10;
    let mut current = 0u32;

    unsafe {
        call_ntapi("NtSetTimerResolution", || {
            let status = NtSetTimerResolution(
                desired_100ns,
                true as u8,
                &mut current,
            );
            (status, current / 10)
        })
    }
}
```

## Retry Strategy

### Exponential Backoff for Transient Errors
```rust
// src-tauri/src/utils/retry.rs

use std::time::Duration;
use tokio::time::sleep;

pub async fn retry_ntapi<F, T>(
    operation_name: &str,
    max_attempts: u32,
    mut f: F,
) -> Result<T, NtApiError>
where
    F: FnMut() -> Result<T, NtApiError>,
{
    let mut attempts = 0;
    let mut delay = Duration::from_millis(100);

    loop {
        attempts += 1;

        match f() {
            Ok(result) => return Ok(result),
            Err(err) => {
                // Retry only untuk transient errors
                let should_retry = matches!(
                    err,
                    NtApiError::BufferTooSmall | NtApiError::Unknown(_)
                );

                if !should_retry || attempts >= max_attempts {
                    log::error!(
                        "NTAPI '{}' failed after {} attempts: {}",
                        operation_name,
                        attempts,
                        err
                    );
                    return Err(err);
                }

                log::warn!(
                    "NTAPI '{}' attempt {}/{} failed, retrying in {:?}",
                    operation_name,
                    attempts,
                    max_attempts,
                    delay
                );

                sleep(delay).await;
                delay *= 2; // Exponential backoff
            }
        }
    }
}
```

### Usage with Retry
```rust
#[tauri::command]
pub async fn purge_memory_with_retry() -> Result<(), String> {
    retry_ntapi("purge_standby_list", 3, || {
        purge_standby_list()
    })
    .await
    .map_err(|e| e.to_string())
}
```

## Logging Strategy

### Structured Logging for NTAPI
```rust
// Always log NTAPI operations dengan context

log::info!(
    "NTAPI: Attempting memory purge (standby: {} MB)",
    standby_size_mb
);

match purge_standby_list() {
    Ok(_) => {
        log::info!("NTAPI: Memory purge succeeded");
    }
    Err(NtApiError::PermissionDenied) => {
        log::error!("NTAPI: Memory purge failed - not running as Admin");
    }
    Err(NtApiError::NotSupported) => {
        log::error!("NTAPI: Memory purge failed - Windows version not supported");
    }
    Err(err) => {
        log::error!("NTAPI: Memory purge failed - {}", err);
    }
}
```

## Windows Version Compatibility

### Version Detection
```rust
// src-tauri/src/utils/windows_version.rs

use windows_sys::Win32::System::SystemInformation::{
    GetVersionExW, OSVERSIONINFOEXW,
};

pub struct WindowsVersion {
    pub major: u32,
    pub minor: u32,
    pub build: u32,
}

impl WindowsVersion {
    pub fn get() -> Option<Self> {
        unsafe {
            let mut version_info: OSVERSIONINFOEXW = std::mem::zeroed();
            version_info.dwOSVersionInfoSize = std::mem::size_of::<OSVERSIONINFOEXW>() as u32;

            if GetVersionExW(&mut version_info as *mut _ as *mut _) != 0 {
                Some(Self {
                    major: version_info.dwMajorVersion,
                    minor: version_info.dwMinorVersion,
                    build: version_info.dwBuildNumber,
                })
            } else {
                None
            }
        }
    }

    pub fn is_windows_10_or_later(&self) -> bool {
        self.major >= 10
    }

    pub fn is_windows_11(&self) -> bool {
        self.major == 10 && self.build >= 22000
    }
}
```

### Feature Gating by Version
```rust
pub fn purge_standby_list() -> Result<(), NtApiError> {
    let version = WindowsVersion::get()
        .ok_or(NtApiError::NotSupported)?;

    if !version.is_windows_10_or_later() {
        return Err(NtApiError::NotSupported);
    }

    // Proceed with NTAPI call
    // ...
}
```

## Testing NTAPI Operations

### Unit Test Pattern
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ntstatus_conversion() {
        let err = NtApiError::from(0xC0000022u32 as i32);
        assert!(matches!(err, NtApiError::PermissionDenied));
    }

    #[test]
    #[ignore] // Requires admin privileges
    fn test_memory_purge() {
        if !PrivilegeChecker::is_elevated() {
            eprintln!("Skipping test - requires admin");
            return;
        }

        let result = purge_standby_list();
        assert!(result.is_ok() || matches!(result, Err(NtApiError::NotSupported)));
    }
}
```

## Frontend Error Display

### User-Friendly Messages
```javascript
// src/utils/errorMessages.js

export function formatNtApiError(error) {
  if (error.includes('Permission denied')) {
    return {
      title: 'Administrator Required',
      message: 'This operation requires Administrator privileges. Please restart the app as Admin.',
      severity: 'error',
    };
  }

  if (error.includes('not supported')) {
    return {
      title: 'Feature Not Available',
      message: 'This feature is not supported on your Windows version. Windows 10 (1909+) or later required.',
      severity: 'warning',
    };
  }

  if (error.includes('NTSTATUS')) {
    return {
      title: 'System Operation Failed',
      message: 'Low-level system operation failed. This may be due to system restrictions or conflicts.',
      severity: 'error',
    };
  }

  return {
    title: 'Operation Failed',
    message: error,
    severity: 'error',
  };
}
```

## Debugging NTAPI Issues

### Debug Checklist
1. [ ] App running as Administrator?
2. [ ] Windows version >= 10 (build 1909+)?
3. [ ] Conflicting system tools (Process Lasso, ISLC)?
4. [ ] Antivirus blocking low-level operations?
5. [ ] NTSTATUS code logged correctly?

### Debug Mode Logging
```rust
#[cfg(debug_assertions)]
fn log_ntapi_call_details(function_name: &str, params: &str) {
    log::debug!("NTAPI CALL: {} with params: {}", function_name, params);
}
```
