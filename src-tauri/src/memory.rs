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
use windows::Win32::System::SystemInformation::{GlobalMemoryStatusEx, MEMORYSTATUSEX};
use std::ffi::c_void;
use std::mem;

use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use sysinfo::System;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct MemoryMetrics {
    pub standby_list_mb: u64,
    pub free_memory_mb: u64,
    pub total_memory_mb: u64,
    pub available_memory_mb: u64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct PagefileMetrics {
    pub used_mb: u64,
    pub total_mb: u64,
    pub usage_percent: f32,
}

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
    pub standby_threshold_mb: u64,
    pub free_memory_threshold_mb: u64,
}

pub struct AutoPurger {
    pub state: Arc<Mutex<AutoPurgerState>>,
}

impl AutoPurger {
    pub fn new() -> Self {
        let state = Arc::new(Mutex::new(AutoPurgerState {
            enabled: false,
            standby_threshold_mb: 4096, // 4GB default
            free_memory_threshold_mb: 2048, // 2GB default
        }));

        let thread_state = state.clone();
        
        thread::spawn(move || {
            let mut sys = System::new_all();
            loop {
                thread::sleep(Duration::from_secs(5)); // Check every 5s
                
                let (enabled, standby_threshold, free_threshold) = {
                    let s = thread_state.lock().unwrap();
                    (s.enabled, s.standby_threshold_mb, s.free_memory_threshold_mb)
                };

                if enabled {
                    sys.refresh_memory();
                    let available_mb = sys.available_memory() / 1024 / 1024;
                    let free_mb = sys.free_memory() / 1024 / 1024;
                    
                    // Estimate standby list (available - free)
                    let standby_estimate = available_mb.saturating_sub(free_mb);
                    
                    if standby_estimate >= standby_threshold && available_mb < free_threshold {
                        log::info!("Auto-purge triggered: Standby ~{} MB, Available {} MB", standby_estimate, available_mb);
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

/// Get current memory metrics including standby list estimation
pub fn get_memory_metrics() -> Result<MemoryMetrics, String> {
    unsafe {
        let mut meminfo = MEMORYSTATUSEX {
            dwLength: mem::size_of::<MEMORYSTATUSEX>() as u32,
            ..Default::default()
        };
        
        if GlobalMemoryStatusEx(&mut meminfo).is_err() {
            return Err("Failed to get memory status".into());
        }
        
        let total_mb = meminfo.ullTotalPhys / 1024 / 1024;
        let available_mb = meminfo.ullAvailPhys / 1024 / 1024;
        
        // Use sysinfo for more detailed metrics
        let mut sys = System::new_all();
        sys.refresh_memory();
        
        let free_mb = sys.free_memory() / 1024 / 1024;
        let standby_mb = available_mb.saturating_sub(free_mb); // Approximation
        
        Ok(MemoryMetrics {
            standby_list_mb: standby_mb,
            free_memory_mb: free_mb,
            total_memory_mb: total_mb,
            available_memory_mb: available_mb,
        })
    }
}

/// Get pagefile usage metrics
pub fn get_pagefile_metrics() -> Result<PagefileMetrics, String> {
    unsafe {
        let mut meminfo = MEMORYSTATUSEX {
            dwLength: mem::size_of::<MEMORYSTATUSEX>() as u32,
            ..Default::default()
        };
        
        if GlobalMemoryStatusEx(&mut meminfo).is_err() {
            return Err("Failed to get memory status".into());
        }
        
        let total_pagefile = meminfo.ullTotalPageFile / 1024 / 1024;
        let avail_pagefile = meminfo.ullAvailPageFile / 1024 / 1024;
        let used_pagefile = total_pagefile.saturating_sub(avail_pagefile);
        let usage_percent = if total_pagefile > 0 {
            (used_pagefile as f32 / total_pagefile as f32) * 100.0
        } else {
            0.0
        };
        
        Ok(PagefileMetrics {
            used_mb: used_pagefile,
            total_mb: total_pagefile,
            usage_percent,
        })
    }
}

/// Get current timer resolution in milliseconds
/// Note: Actual timer resolution querying requires additional Windows APIs
/// For now, returns a placeholder that can be extended with NtQueryTimerResolution
pub fn get_timer_resolution() -> Result<f64, String> {
    // Windows default is typically 15.6ms
    // This is a simplified version - full implementation would use:
    // NtQueryTimerResolution from ntdll.dll
    Ok(15.6)
}
