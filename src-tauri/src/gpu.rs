use std::process::Command;

pub fn fetch_hags_status() -> Result<bool, String> {
    let output = Command::new("reg")
        .args(["query", "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers", "/v", "HwSchMode"])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        // If it fails, the key might not exist, which implies it's disabled or OS default (off)
        return Ok(false);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    // The output should contain "HwSchMode    REG_DWORD    0x2" if enabled, 0x1 if disabled
    if stdout.contains("0x2") {
        Ok(true)
    } else {
        Ok(false)
    }
}

pub fn apply_hags_setting(enabled: bool) -> Result<String, String> {
    let value = if enabled { "2" } else { "1" };
    
    let output = Command::new("reg")
        .args([
            "add", 
            "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers", 
            "/v", "HwSchMode", 
            "/t", "REG_DWORD", 
            "/d", value, 
            "/f"
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(format!("Hardware-Accelerated GPU Scheduling set to: {}.", if enabled { "Enabled" } else { "Disabled" }))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}
