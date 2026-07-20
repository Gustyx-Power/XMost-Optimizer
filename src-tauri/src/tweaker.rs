use std::process::Command;

pub fn enable_ultimate_power_plan() -> Result<String, String> {
    // Duplicate the Ultimate Performance GUID
    // Ignore errors for this step because it might already be duplicated
    let _ = Command::new("powercfg")
        .args(["-duplicatescheme", "e9a42b02-d5df-448d-aa00-03f14749eb61"])
        .output();
        
    // Now set it as active
    let output = Command::new("powercfg")
        .args(["-setactive", "e9a42b02-d5df-448d-aa00-03f14749eb61"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("Ultimate Performance Power Plan applied successfully.".into())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
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
