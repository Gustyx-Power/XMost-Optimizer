use serde::{Deserialize, Serialize};
use sysinfo::System;
use std::sync::Mutex;
use wmi::WMIConnection;

#[derive(Serialize, Clone, Default)]
pub struct HardwareInfo {
    pub cpu: String,
    pub cpu_codename: String,
    pub cpu_cores: String,
    pub cpu_threads: String,
    pub cpu_speed: String,
    pub cpu_process: String,
    pub gpu: String,
    pub gpu_codename: String,
    pub gpu_vram: String,
    pub gpu_driver: String,
    pub gpu_process: String,
    pub motherboard: String,
    pub os: String,
    pub bios_brand: String,
    pub bios_version: String,
    pub bios_date: String,
    pub ram_brand: String,
    pub ram_type: String,
    pub ram_speed: String,
    pub ram_layout: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
#[allow(non_camel_case_types)]
struct Win32_Processor {
    name: String,
    #[serde(rename = "NumberOfCores")]
    number_of_cores: Option<u32>,
    #[serde(rename = "NumberOfLogicalProcessors")]
    number_of_logical_processors: Option<u32>,
    #[serde(rename = "MaxClockSpeed")]
    max_clock_speed: Option<u32>,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
#[allow(non_camel_case_types)]
struct Win32_VideoController {
    name: String,
    #[serde(rename = "AdapterRAM")]
    adapter_ram: Option<u64>,
    #[serde(rename = "DriverVersion")]
    driver_version: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
#[allow(non_camel_case_types)]
struct Win32_BaseBoard {
    product: String,
    manufacturer: String,
}

#[derive(Deserialize)]
#[allow(non_camel_case_types)]
struct Win32_OperatingSystem {
    #[serde(rename = "Caption")]
    caption: Option<String>,
    #[serde(rename = "Version")]
    version: Option<String>,
}

#[derive(Deserialize)]
#[allow(non_camel_case_types)]
struct Win32_PhysicalMemory {
    #[serde(rename = "Manufacturer")]
    manufacturer: Option<String>,
    #[serde(rename = "ConfiguredClockSpeed")]
    configured_clock_speed: Option<u32>,
    #[serde(rename = "SMBIOSMemoryType")]
    smbios_memory_type: Option<u32>,
    #[serde(rename = "Capacity")]
    capacity: Option<u64>,
}

#[derive(Deserialize)]
#[allow(non_camel_case_types)]
struct Win32_BIOS {
    #[serde(rename = "Manufacturer")]
    manufacturer: Option<String>,
    #[serde(rename = "SMBIOSBIOSVersion")]
    smbios_bios_version: Option<String>,
    #[serde(rename = "ReleaseDate")]
    release_date: Option<String>,
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

fn parse_wmi_date(wmi_date: &str) -> String {
    if wmi_date.len() >= 8 {
        let year = &wmi_date[0..4];
        let month = &wmi_date[4..6];
        let day = &wmi_date[6..8];
        format!("{}/{}/{}", month, day, year)
    } else {
        wmi_date.to_string()
    }
}

fn detect_cpu_codename(cpu_name: &str) -> String {
    let name_upper = cpu_name.to_uppercase();
    if name_upper.contains("INTEL") {
        if name_upper.contains("14") && (name_upper.contains("K") || name_upper.contains("F") || name_upper.contains("T") || name_upper.contains("00")) {
            "Raptor Lake-R".to_string()
        } else if name_upper.contains("13") && (name_upper.contains("K") || name_upper.contains("F") || name_upper.contains("T") || name_upper.contains("00")) {
            "Raptor Lake".to_string()
        } else if name_upper.contains("12") && (name_upper.contains("K") || name_upper.contains("F") || name_upper.contains("T") || name_upper.contains("00")) {
            "Alder Lake".to_string()
        } else if name_upper.contains("11") && (name_upper.contains("K") || name_upper.contains("F") || name_upper.contains("T") || name_upper.contains("00")) {
            "Rocket Lake".to_string()
        } else if name_upper.contains("10") && (name_upper.contains("K") || name_upper.contains("F") || name_upper.contains("T") || name_upper.contains("00")) {
            "Comet Lake".to_string()
        } else if name_upper.contains("9") && (name_upper.contains("K") || name_upper.contains("F") || name_upper.contains("00")) {
            "Coffee Lake-R".to_string()
        } else if name_upper.contains("8") && (name_upper.contains("K") || name_upper.contains("00")) {
            "Coffee Lake".to_string()
        } else if name_upper.contains("7") && (name_upper.contains("K") || name_upper.contains("00")) {
            "Kaby Lake".to_string()
        } else if name_upper.contains("6") && (name_upper.contains("K") || name_upper.contains("00")) {
            "Skylake".to_string()
        } else if name_upper.contains("ULTRA") {
            if name_upper.contains("2") {
                "Arrow Lake".to_string()
            } else {
                "Meteor Lake".to_string()
            }
        } else {
            "Intel Core".to_string()
        }
    } else if name_upper.contains("AMD") || name_upper.contains("RYZEN") {
        if name_upper.contains("9") && (name_upper.contains("00X") || name_upper.contains("00F") || name_upper.contains("600")) {
            "Granite Ridge (Zen 5)".to_string()
        } else if name_upper.contains("8") && name_upper.contains("00") {
            "Hawk Point (Zen 4)".to_string()
        } else if name_upper.contains("7") && (name_upper.contains("00X") || name_upper.contains("800") || name_upper.contains("600")) {
            "Raphael (Zen 4)".to_string()
        } else if name_upper.contains("6") && name_upper.contains("00") {
            "Rembrandt (Zen 3+)".to_string()
        } else if name_upper.contains("5") && (name_upper.contains("00X") || name_upper.contains("800") || name_upper.contains("600")) {
            if name_upper.contains("G") {
                "Cezanne (Zen 3)".to_string()
            } else {
                "Vermeer (Zen 3)".to_string()
            }
        } else if name_upper.contains("4") && name_upper.contains("00") {
            "Renoir (Zen 2)".to_string()
        } else if name_upper.contains("3") && (name_upper.contains("00X") || name_upper.contains("700") || name_upper.contains("600")) {
            "Matisse (Zen 2)".to_string()
        } else if name_upper.contains("2") && name_upper.contains("00") {
            "Pinnacle Ridge (Zen+)".to_string()
        } else if name_upper.contains("1") && name_upper.contains("00") {
            "Summit Ridge (Zen)".to_string()
        } else {
            "AMD Zen".to_string()
        }
    } else {
        "Generic Core".to_string()
    }
}

fn detect_cpu_process(cpu_name: &str) -> String {
    let name_upper = cpu_name.to_uppercase();
    if name_upper.contains("INTEL") {
        if name_upper.contains("14") && (name_upper.contains("K") || name_upper.contains("F") || name_upper.contains("T") || name_upper.contains("00")) {
            "7 nm".to_string()
        } else if name_upper.contains("13") && (name_upper.contains("K") || name_upper.contains("F") || name_upper.contains("T") || name_upper.contains("00")) {
            "7 nm".to_string()
        } else if name_upper.contains("12") && (name_upper.contains("K") || name_upper.contains("F") || name_upper.contains("T") || name_upper.contains("00")) {
            "7 nm".to_string()
        } else if name_upper.contains("11") && (name_upper.contains("K") || name_upper.contains("F") || name_upper.contains("T") || name_upper.contains("00")) {
            "14 nm".to_string()
        } else if name_upper.contains("10") && (name_upper.contains("K") || name_upper.contains("F") || name_upper.contains("T") || name_upper.contains("00")) {
            "14 nm".to_string()
        } else if name_upper.contains("9") && (name_upper.contains("K") || name_upper.contains("F") || name_upper.contains("00")) {
            "14 nm".to_string()
        } else if name_upper.contains("8") && (name_upper.contains("K") || name_upper.contains("00")) {
            "14 nm".to_string()
        } else if name_upper.contains("7") && (name_upper.contains("K") || name_upper.contains("00")) {
            "14 nm".to_string()
        } else if name_upper.contains("6") && (name_upper.contains("K") || name_upper.contains("00")) {
            "14 nm".to_string()
        } else if name_upper.contains("ULTRA") {
            if name_upper.contains("2") {
                "3 nm".to_string()
            } else {
                "4 nm".to_string()
            }
        } else {
            "14 nm".to_string()
        }
    } else if name_upper.contains("AMD") || name_upper.contains("RYZEN") {
        if name_upper.contains("9") && (name_upper.contains("00X") || name_upper.contains("00F") || name_upper.contains("600")) {
            "4 nm".to_string()
        } else if name_upper.contains("8") && name_upper.contains("00") {
            "4 nm".to_string()
        } else if name_upper.contains("7") && (name_upper.contains("00X") || name_upper.contains("800") || name_upper.contains("600")) {
            "5 nm".to_string()
        } else if name_upper.contains("6") && name_upper.contains("00") {
            "6 nm".to_string()
        } else if name_upper.contains("5") && (name_upper.contains("00X") || name_upper.contains("800") || name_upper.contains("600")) {
            "7 nm".to_string()
        } else if name_upper.contains("4") && name_upper.contains("00") {
            "7 nm".to_string()
        } else if name_upper.contains("3") && (name_upper.contains("00X") || name_upper.contains("700") || name_upper.contains("600")) {
            "7 nm".to_string()
        } else if name_upper.contains("2") && name_upper.contains("00") {
            "12 nm".to_string()
        } else if name_upper.contains("1") && name_upper.contains("00") {
            "14 nm".to_string()
        } else {
            "7 nm".to_string()
        }
    } else {
        "7 nm".to_string()
    }
}

fn detect_gpu_codename(gpu_name: &str) -> String {
    let name_upper = gpu_name.to_uppercase();
    if name_upper.contains("NVIDIA") || name_upper.contains("GEFORCE") {
        if name_upper.contains("4090") {
            "AD102 (Ada Lovelace)".to_string()
        } else if name_upper.contains("4080") {
            "AD103 (Ada Lovelace)".to_string()
        } else if name_upper.contains("4070") {
            "AD104 (Ada Lovelace)".to_string()
        } else if name_upper.contains("4060") {
            "AD106/AD107 (Ada)".to_string()
        } else if name_upper.contains("3090") || name_upper.contains("3080") {
            "GA102 (Ampere)".to_string()
        } else if name_upper.contains("3070") || name_upper.contains("3060 TI") {
            "GA104 (Ampere)".to_string()
        } else if name_upper.contains("3060") {
            "GA106 (Ampere)".to_string()
        } else if name_upper.contains("3050") {
            "GA107 (Ampere)".to_string()
        } else if name_upper.contains("2080") {
            "TU102/TU104 (Turing)".to_string()
        } else if name_upper.contains("2070") || name_upper.contains("2060") {
            "TU106 (Turing)".to_string()
        } else if name_upper.contains("1660") {
            "TU116 (Turing)".to_string()
        } else if name_upper.contains("1650") {
            "TU117 (Turing)".to_string()
        } else if name_upper.contains("1080") || name_upper.contains("1070") {
            "GP104 (Pascal)".to_string()
        } else if name_upper.contains("1060") {
            "GP106 (Pascal)".to_string()
        } else if name_upper.contains("1050") {
            "GP107 (Pascal)".to_string()
        } else if name_upper.contains("750") {
            "GM107 (Maxwell)".to_string()
        } else {
            "NVIDIA GPU".to_string()
        }
    } else if name_upper.contains("AMD") || name_upper.contains("RADEON") {
        if name_upper.contains("7900") {
            "Navi 31 (RDNA 3)".to_string()
        } else if name_upper.contains("7800") || name_upper.contains("7700") {
            "Navi 32 (RDNA 3)".to_string()
        } else if name_upper.contains("7600") {
            "Navi 33 (RDNA 3)".to_string()
        } else if name_upper.contains("6900") || name_upper.contains("6800") || name_upper.contains("6950") {
            "Navi 21 (RDNA 2)".to_string()
        } else if name_upper.contains("6700") || name_upper.contains("6750") {
            "Navi 22 (RDNA 2)".to_string()
        } else if name_upper.contains("6600") || name_upper.contains("6650") {
            "Navi 23 (RDNA 2)".to_string()
        } else if name_upper.contains("6500") || name_upper.contains("6400") {
            "Navi 24 (RDNA 2)".to_string()
        } else if name_upper.contains("5700") {
            "Navi 10 (RDNA 1)".to_string()
        } else if name_upper.contains("5600") || name_upper.contains("5500") {
            "Navi 14 (RDNA 1)".to_string()
        } else if name_upper.contains("580") || name_upper.contains("570") {
            "Polaris 20 (GCN 4)".to_string()
        } else {
            "AMD Radeon".to_string()
        }
    } else if name_upper.contains("INTEL") {
        if name_upper.contains("ARC") {
            "Alchemist ACM-G10".to_string()
        } else {
            "Intel Graphics".to_string()
        }
    } else {
        "Generic Core".to_string()
    }
}

fn detect_gpu_process(gpu_name: &str) -> String {
    let name_upper = gpu_name.to_uppercase();
    if name_upper.contains("NVIDIA") || name_upper.contains("GEFORCE") {
        if name_upper.contains("4090") || name_upper.contains("4080") || name_upper.contains("4070") || name_upper.contains("4060") {
            "4 nm".to_string()
        } else if name_upper.contains("3090") || name_upper.contains("3080") || name_upper.contains("3070") || name_upper.contains("3060") || name_upper.contains("3050") {
            "8 nm".to_string()
        } else if name_upper.contains("2080") || name_upper.contains("2070") || name_upper.contains("2060") || name_upper.contains("1660") || name_upper.contains("1650") {
            "12 nm".to_string()
        } else if name_upper.contains("1080") || name_upper.contains("1070") || name_upper.contains("1060") || name_upper.contains("1050") {
            "16 nm".to_string()
        } else if name_upper.contains("750") {
            "28 nm".to_string()
        } else {
            "12 nm".to_string()
        }
    } else if name_upper.contains("AMD") || name_upper.contains("RADEON") {
        if name_upper.contains("7900") || name_upper.contains("7800") || name_upper.contains("7700") || name_upper.contains("7600") {
            "5 nm".to_string()
        } else if name_upper.contains("6900") || name_upper.contains("6800") || name_upper.contains("6700") || name_upper.contains("6600") || name_upper.contains("6500") {
            "7 nm".to_string()
        } else if name_upper.contains("5700") || name_upper.contains("5600") || name_upper.contains("5500") {
            "7 nm".to_string()
        } else if name_upper.contains("580") || name_upper.contains("570") {
            "14 nm".to_string()
        } else {
            "7 nm".to_string()
        }
    } else if name_upper.contains("INTEL") {
        if name_upper.contains("ARC") {
            "6 nm".to_string()
        } else {
            "10 nm".to_string()
        }
    } else {
        "12 nm".to_string()
    }
}

fn fetch_hardware_info() -> Result<HardwareInfo, String> {
    let wmi_con = WMIConnection::new().map_err(|e| e.to_string())?;

    // CPU Query
    let processors: Vec<Win32_Processor> = wmi_con.query().unwrap_or_default();
    let cpu_first = processors.into_iter().next();
    
    let cpu = cpu_first.as_ref()
        .map(|p| p.name.trim().to_string())
        .unwrap_or_else(|| "Unknown CPU".into());
    let cpu_codename = detect_cpu_codename(&cpu);
    let cpu_process = detect_cpu_process(&cpu);

    let cpu_cores = cpu_first.as_ref()
        .and_then(|p| p.number_of_cores)
        .map(|c| c.to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    let cpu_threads = cpu_first.as_ref()
        .and_then(|p| p.number_of_logical_processors)
        .map(|t| t.to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    let cpu_speed = cpu_first.as_ref()
        .and_then(|p| p.max_clock_speed)
        .map(|s| {
            let ghz = s as f64 / 1000.0;
            format!("{:.2} GHz", ghz)
        })
        .unwrap_or_else(|| "Unknown".to_string());

    // GPU Query
    let gpus: Vec<Win32_VideoController> = wmi_con.query().unwrap_or_default();
    
    let mut gpu_names = Vec::new();
    let mut gpu_codenames = Vec::new();
    let mut gpu_processes = Vec::new();
    let mut gpu_vrams = Vec::new();
    let mut gpu_drivers = Vec::new();

    for g in gpus {
        let name = g.name.trim().to_string();
        gpu_names.push(name.clone());
        gpu_codenames.push(detect_gpu_codename(&name));
        gpu_processes.push(detect_gpu_process(&name));

        let vram = g.adapter_ram.map(|r| {
            let gb = r as f64 / 1024.0 / 1024.0 / 1024.0;
            if gb >= 1.0 {
                format!("{:.0} GB", gb)
            } else {
                let mb = r / 1024 / 1024;
                format!("{} MB", mb)
            }
        }).unwrap_or_else(|| "Unknown".to_string());
        gpu_vrams.push(vram);

        gpu_drivers.push(g.driver_version.as_ref().map(|d| d.trim().to_string()).unwrap_or_else(|| "Unknown".to_string()));
    }

    let (gpu, gpu_codename, gpu_vram, gpu_driver, gpu_process) = if gpu_names.is_empty() {
        ("Unknown GPU".into(), "Unknown".into(), "Unknown".into(), "Unknown".into(), "Unknown".into())
    } else {
        (
            gpu_names.join(" & "),
            gpu_codenames.join(" & "),
            gpu_vrams.join(" & "),
            gpu_drivers.join(" & "),
            gpu_processes.join(" & ")
        )
    };

    // Motherboard Query
    let boards: Vec<Win32_BaseBoard> = wmi_con.query().unwrap_or_default();
    let motherboard = boards.into_iter().next().map(|b| format!("{} {}", b.manufacturer.trim(), b.product.trim())).unwrap_or_else(|| "Unknown Motherboard".into());

    // OS Query (Windows Caption & Version/Build)
    let os_list: Vec<Win32_OperatingSystem> = wmi_con.query().unwrap_or_default();
    let os = os_list.into_iter().next()
        .map(|o| {
            let cap = o.caption.unwrap_or_else(|| "Windows 10".to_string());
            let ver = o.version.unwrap_or_else(|| "".to_string());
            if ver.is_empty() {
                cap.trim().to_string()
            } else {
                format!("{} (Build {})", cap.trim(), ver.trim())
            }
        })
        .unwrap_or_else(|| "Windows (Unknown)".into());

    // RAM Query (Physical Memory Details)
    let ram_list: Vec<Win32_PhysicalMemory> = wmi_con.query().unwrap_or_default();
    
    let mut ram_manufacturers: Vec<String> = ram_list.iter()
        .filter_map(|r| r.manufacturer.as_ref().map(|m| m.trim().to_string()))
        .filter(|m| !m.is_empty())
        .collect();
    ram_manufacturers.dedup();
    
    let ram_brand = if ram_manufacturers.is_empty() {
        "Unknown".to_string()
    } else {
        ram_manufacturers.join(" & ")
    };

    let ram_type = ram_list.first()
        .and_then(|r| r.smbios_memory_type)
        .map(|t| {
            match t {
                20 => "DDR",
                21 => "DDR2",
                22 => "DDR2 FB-DIMM",
                24 => "DDR3",
                26 => "DDR4",
                34 => "DDR5",
                _ => "DDR",
            }
        })
        .unwrap_or("DDR4")
        .to_string();

    let ram_speed = ram_list.first()
        .and_then(|r| r.configured_clock_speed)
        .map(|s| format!("{} MHz", s))
        .unwrap_or_else(|| "Unknown".to_string());

    let ram_layout = if ram_list.is_empty() {
        "Unknown".to_string()
    } else {
        let count = ram_list.len();
        let total_capacity: u64 = ram_list.iter()
            .filter_map(|r| r.capacity)
            .sum();
        let total_capacity_gb = total_capacity / 1024 / 1024 / 1024;
        format!("{}x DIMM ({} GB Total)", count, total_capacity_gb)
    };

    // BIOS Query (Manufacturer, Version & Date)
    let bios_list: Vec<Win32_BIOS> = wmi_con.query().unwrap_or_default();
    let bios_first = bios_list.into_iter().next();
    
    let bios_brand = bios_first.as_ref()
        .and_then(|b| b.manufacturer.as_ref().map(|m| m.trim().to_string()))
        .unwrap_or_else(|| "Unknown".to_string());

    let bios_version = bios_first.as_ref()
        .and_then(|b| b.smbios_bios_version.as_ref().map(|v| v.trim().to_string()))
        .unwrap_or_else(|| "Unknown".to_string());

    let bios_date = bios_first.as_ref()
        .and_then(|b| b.release_date.as_ref().map(|d| d.trim().to_string()))
        .map(|d| parse_wmi_date(&d))
        .unwrap_or_else(|| "Unknown".to_string());

    Ok(HardwareInfo { 
        cpu, 
        cpu_codename, 
        cpu_cores, 
        cpu_threads, 
        cpu_speed, 
        cpu_process, 
        gpu, 
        gpu_codename, 
        gpu_vram, 
        gpu_driver, 
        gpu_process, 
        motherboard, 
        os, 
        bios_brand, 
        bios_version, 
        bios_date, 
        ram_brand, 
        ram_type, 
        ram_speed, 
        ram_layout, 
    })
}

#[derive(Serialize)]
pub struct SystemStats {
    pub cpu_usage: f32, // percentage 0-100
    pub total_memory: u64, // bytes
    pub used_memory: u64, // bytes
    pub available_memory: u64, // bytes
}
