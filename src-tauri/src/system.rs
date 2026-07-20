use serde::{Deserialize, Serialize};
use sysinfo::System;
use std::sync::Mutex;
use wmi::WMIConnection;

#[derive(Serialize, Clone, Default)]
pub struct HardwareInfo {
    pub cpu: String,
    pub gpu: String,
    pub motherboard: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
#[allow(non_camel_case_types)]
struct Win32_Processor {
    name: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
#[allow(non_camel_case_types)]
struct Win32_VideoController {
    name: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
#[allow(non_camel_case_types)]
struct Win32_BaseBoard {
    product: String,
    manufacturer: String,
}

pub struct SystemMonitor {
    pub sys: Mutex<System>,
    pub hw_info: HardwareInfo,
}

impl SystemMonitor {
    pub fn new() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();
        
        let hw_info = fetch_hardware_info().unwrap_or_default();

        Self {
            sys: Mutex::new(sys),
            hw_info,
        }
    }
}

fn fetch_hardware_info() -> Result<HardwareInfo, String> {
    let wmi_con = WMIConnection::new().map_err(|e| e.to_string())?;

    let processors: Vec<Win32_Processor> = wmi_con.query().unwrap_or_default();
    let cpu = processors.into_iter().next().map(|p| p.name.trim().to_string()).unwrap_or_else(|| "Unknown CPU".into());

    let gpus: Vec<Win32_VideoController> = wmi_con.query().unwrap_or_default();
    let gpu = gpus.into_iter().next().map(|g| g.name.trim().to_string()).unwrap_or_else(|| "Unknown GPU".into());

    let boards: Vec<Win32_BaseBoard> = wmi_con.query().unwrap_or_default();
    let motherboard = boards.into_iter().next().map(|b| format!("{} {}", b.manufacturer.trim(), b.product.trim())).unwrap_or_else(|| "Unknown Motherboard".into());

    Ok(HardwareInfo { cpu, gpu, motherboard })
}

#[derive(Serialize)]
pub struct SystemStats {
    pub cpu_usage: f32, // percentage 0-100
    pub total_memory: u64, // bytes
    pub used_memory: u64, // bytes
    pub available_memory: u64, // bytes
}
