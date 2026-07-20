use ntapi::ntexapi::{
    NtSetSystemInformation, SystemMemoryListInformation, SYSTEM_MEMORY_LIST_COMMAND,
};
use windows::core::PCWSTR;
use windows::Win32::Foundation::{HANDLE, LUID, CloseHandle, GetLastError};
use windows::Win32::Security::{
    AdjustTokenPrivileges, LookupPrivilegeValueW, SE_PRIVILEGE_ENABLED, TOKEN_ADJUST_PRIVILEGES,
    TOKEN_PRIVILEGES, TOKEN_QUERY, SE_PROF_SINGLE_PROCESS_NAME
};
use windows::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};
use std::ffi::c_void;

use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use sysinfo::System;

pub fn enable_privilege() -> Result<(), String> {
    unsafe {
        let mut token: HANDLE = HANDLE::default();
        if OpenProcessToken(GetCurrentProcess(), TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, &mut token).is_err() {
            return Err("Failed to open process token".into());
        }

        let mut luid = LUID::default();
        if LookupPrivilegeValueW(PCWSTR::null(), SE_PROF_SINGLE_PROCESS_NAME, &mut luid).is_err() {
            let _ = CloseHandle(token);
            return Err("Failed to lookup privilege value".into());
        }

        let mut tp = TOKEN_PRIVILEGES {
            PrivilegeCount: 1,
            Privileges: [windows::Win32::Security::LUID_AND_ATTRIBUTES {
                Luid: luid,
                Attributes: SE_PRIVILEGE_ENABLED,
            }; 1],
        };

        let result = AdjustTokenPrivileges(token, false, Some(&mut tp), 0, None, None);
        let _ = CloseHandle(token);

        if result.is_err() || GetLastError().is_err() {
            return Err("Failed to adjust token privileges (Not running as Admin?)".into());
        }
    }
    Ok(())
}

pub fn purge_standby_list() -> Result<(), String> {
    enable_privilege()?;
    unsafe {
        let command: SYSTEM_MEMORY_LIST_COMMAND = ntapi::ntexapi::MemoryPurgeStandbyList;
        let status = NtSetSystemInformation(
            SystemMemoryListInformation,
            &command as *const _ as *mut ntapi::winapi::ctypes::c_void,
            std::mem::size_of::<SYSTEM_MEMORY_LIST_COMMAND>() as u32,
        );

        if status != 0 {
            return Err(format!("NtSetSystemInformation failed with status: {:#x}", status));
        }
    }
    Ok(())
}

pub struct AutoPurgerState {
    pub enabled: bool,
    pub threshold_mb: u64,
}

pub struct AutoPurger {
    pub state: Arc<Mutex<AutoPurgerState>>,
}

impl AutoPurger {
    pub fn new() -> Self {
        let state = Arc::new(Mutex::new(AutoPurgerState {
            enabled: false,
            threshold_mb: 1024, // 1GB default
        }));

        let thread_state = state.clone();
        
        thread::spawn(move || {
            let mut sys = System::new_all();
            loop {
                thread::sleep(Duration::from_secs(5)); // Check every 5s
                
                let (enabled, threshold_mb) = {
                    let s = thread_state.lock().unwrap();
                    (s.enabled, s.threshold_mb)
                };

                if enabled {
                    sys.refresh_memory();
                    let available_mb = sys.available_memory() / 1024 / 1024;
                    if available_mb < threshold_mb {
                        log::info!("Available memory ({} MB) below threshold ({} MB). Purging...", available_mb, threshold_mb);
                        if let Err(e) = purge_standby_list() {
                            log::error!("Failed to purge standby list: {}", e);
                        }
                    }
                }
            }
        });

        Self { state }
    }
}
