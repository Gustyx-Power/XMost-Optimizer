use std::process::Command;

pub fn enable_ultimate_power_plan() -> Result<String, String> {
    // 1. Try to duplicate the Ultimate Performance GUID
    let _ = Command::new("powercfg")
        .args(["-duplicatescheme", "e9a42b02-d5df-448d-aa00-03f14749eb61"])
        .output();
        
    // 2. Try to activate Ultimate Performance
    let act_ult = Command::new("powercfg")
        .args(["-setactive", "e9a42b02-d5df-448d-aa00-03f14749eb61"])
        .output();

    if let Ok(ref output) = act_ult {
        if output.status.success() {
            return Ok("Ultimate Performance Power Plan applied successfully.".into());
        }
    }

    // 3. Fallback: Duplicate and activate High Performance plan (8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c)
    let _ = Command::new("powercfg")
        .args(["-duplicatescheme", "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"])
        .output();
        
    let act_high = Command::new("powercfg")
        .args(["-setactive", "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"])
        .output()
        .map_err(|e| e.to_string())?;

    if act_high.status.success() {
        Ok("Ultimate Performance is not supported on this Windows configuration. Universal High Performance Power Plan has been applied instead.".into())
    } else {
        let stderr = String::from_utf8_lossy(&act_high.stderr).to_string();
        Err(format!("Error: {}", stderr.trim()))
    }
}

pub fn disable_core_parking() -> Result<String, String> {
    // cparkffs 100 sets the "Processor performance core parking min cores" to 100%, effectively disabling parking
    // The GUIDs:
    // Subgroup: 54533251-82be-4824-96c1-47b60b740d00 (Processor power management)
    // Setting: 0cc5b647-c1df-4637-891a-dec35c318583 (Processor performance core parking min cores)
    
    // Set for AC power
    let output_ac = Command::new("powercfg")
        .args([
            "-setacvalueindex", "scheme_current", 
            "54533251-82be-4824-96c1-47b60b740d00", 
            "0cc5b647-c1df-4637-891a-dec35c318583", 
            "100"
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !output_ac.status.success() {
        return Err(String::from_utf8_lossy(&output_ac.stderr).to_string());
    }

    // Set for DC (Battery) power
    let output_dc = Command::new("powercfg")
        .args([
            "-setdcvalueindex", "scheme_current", 
            "54533251-82be-4824-96c1-47b60b740d00", 
            "0cc5b647-c1df-4637-891a-dec35c318583", 
            "100"
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !output_dc.status.success() {
        return Err(String::from_utf8_lossy(&output_dc.stderr).to_string());
    }
    
    // Apply changes
    let apply = Command::new("powercfg")
        .args(["-setactive", "scheme_current"])
        .output()
        .map_err(|e| e.to_string())?;

    if apply.status.success() {
        Ok("Core parking disabled successfully.".into())
    } else {
        Err(String::from_utf8_lossy(&apply.stderr).to_string())
    }
}
