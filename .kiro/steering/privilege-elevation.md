---
inclusion: auto
---

# Privilege Elevation Pattern

## Overview
XMOST-OPTIMIZER HARUS berjalan dengan Administrator privileges untuk mengakses NTAPI, registry HKLM, dan service management. Steering ini mendefinisikan pattern privilege checking dan elevation handling.

## Tauri Manifest Configuration

### tauri.conf.json - Windows Manifest
```json
{
  "tauri": {
    "bundle": {
      "windows": {
        "requestedExecutionLevel": "requireAdministrator",
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      }
    }
  }
}
```

**Effect**: App akan automatically trigger UAC prompt saat launch.

## Privilege Check Utility

### Implementation Pattern
```rust
// src-tauri/src/utils/privilege_check.rs

use windows_sys::Win32::Foundation::HANDLE;
use windows_sys::Win32::Security::{
    GetTokenInformation, TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY,
};
use windows_sys::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};

pub struct PrivilegeChecker;

impl PrivilegeChecker {
    /// Check if current process is running with Administrator privileges
    pub fn is_elevated() -> bool {
        unsafe {
            let mut token: HANDLE = 0;
            let process = GetCurrentProcess();

            if OpenProcessToken(process, TOKEN_QUERY, &mut token) == 0 {
                return false;
            }

            let mut elevation = TOKEN_ELEVATION { TokenIsElevated: 0 };
            let mut return_length = 0u32;

            let result = GetTokenInformation(
                token,
                TokenElevation,
                &mut elevation as *mut _ as *mut _,
                std::mem::size_of::<TOKEN_ELEVATION>() as u32,
                &mut return_length,
            );

            windows_sys::Win32::Foundation::CloseHandle(token);

            result != 0 && elevation.TokenIsElevated != 0
        }
    }

    /// Check on app startup - exit if not elevated
    pub fn require_elevation_or_exit() {
        if !Self::is_elevated() {
            eprintln!("ERROR: This application requires Administrator privileges.");
            eprintln!("Please right-click and select 'Run as Administrator'.");
            std::process::exit(1);
        }
    }
}
```

## Usage in main.rs

### App Initialization
```rust
// src-tauri/src/main.rs

use utils::privilege_check::PrivilegeChecker;

fn main() {
    // CRITICAL: Check privileges before ANY operations
    PrivilegeChecker::require_elevation_or_exit();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // ... your commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Per-Command Privilege Checking

### Pattern for Sensitive Operations
```rust
// Apply this pattern untuk SEMUA commands yang access NTAPI/Registry/Services

#[tauri::command]
pub fn sensitive_operation() -> Result<(), String> {
    // 1. Always check privilege first
    if !PrivilegeChecker::is_elevated() {
        return Err("Administrator privileges required".to_string());
    }

    // 2. Proceed with operation
    // ...

    Ok(())
}
```

### Commands Requiring Privilege Check
- `purge_memory_manual()` - NTAPI call
- `set_timer_resolution()` - NTAPI call
- `set_hags_state()` - Registry HKLM write
- `toggle_service()` - Service control
- `set_process_affinity()` - Process manipulation
- `set_power_plan()` - Power configuration

## Frontend Privilege Awareness

### Privilege Status Component
```javascript
// src/components/PrivilegeStatus.jsx
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export function PrivilegeStatus() {
  const [isElevated, setIsElevated] = useState(false);

  useEffect(() => {
    invoke('is_elevated').then(setIsElevated);
  }, []);

  if (isElevated) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-1 rounded text-sm">
        ✓ Running as Administrator
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
      ⚠️ Not running as Administrator - some features disabled
    </div>
  );
}
```

### Error Handling for Privilege Errors
```javascript
// Pattern untuk handle privilege errors dari backend

const handleOperation = async () => {
  try {
    await invoke('sensitive_operation');
  } catch (error) {
    if (error.includes('Administrator privileges required')) {
      toast.error('Please restart the application as Administrator');
      // Optionally: Show modal dengan instructions
    } else {
      toast.error(error);
    }
  }
};
```

## Testing Privilege Scenarios

### Test Matrix
1. **As Administrator** (Expected Path):
   - [ ] All operations succeed
   - [ ] No privilege errors

2. **As Standard User** (Graceful Degradation):
   - [ ] App shows warning on startup
   - [ ] Sensitive operations return error
   - [ ] Read-only operations still work (dashboard monitoring)

3. **UAC Disabled** (Rare Case):
   - [ ] App detects admin account but UAC disabled
   - [ ] Operations still succeed (admin without elevation)

## Build Configuration

### Development
```bash
# Always test dengan admin privileges during development
cargo tauri dev --release
# Right-click on executable -> Run as Administrator
```

### Production Build
```bash
cargo tauri build --release
# Resulting .exe akan embed manifest dengan requireAdministrator
# User akan automatically prompted saat launch
```

## Troubleshooting

### Issue: UAC Prompt Loops
**Cause**: Spawning child processes tanpa inherit privileges  
**Solution**: Use `runas` command atau inherit token

### Issue: Operations Fail Despite Admin
**Cause**: Process token tidak elevated (UAC virtualization)  
**Solution**: Verify `requestedExecutionLevel` dalam manifest

### Issue: Cannot Debug with Admin
**Cause**: IDE tidak running as admin  
**Solution**: Run VS Code/IDE as Administrator, atau disable debug privilege check

## Security Considerations

### Principle of Least Privilege
- **Current Approach**: Require admin untuk entire app (simplest)
- **Alternative**: Split ke privileged service + unprivileged UI (complex)
- **Justification**: App adalah system tweaker, admin adalah expected requirement

### Attack Surface
- Validate ALL user inputs before privilege operations
- No arbitrary command execution dari user input
- Whitelist approach untuk service names, registry paths

### Audit Logging
```rust
// Log semua privileged operations
log::info!("ADMIN_OP: Purged {} MB of standby memory", freed_mb);
log::info!("ADMIN_OP: Set power plan to {}", plan_guid);
```
