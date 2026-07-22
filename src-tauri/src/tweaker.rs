use std::process::Command;
use serde::Serialize;
use std::fs;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
struct TempProgress {
    percentage: u32,
    current_file: String,
}

#[derive(Serialize)]
pub struct TempInfo {
    pub files: u64,
    pub dirs: u64,
    pub size_bytes: u64,
}

pub fn get_temp_info() -> Result<TempInfo, String> {
    let temp_dir = std::env::temp_dir();
    let mut files = 0;
    let mut dirs = 0;
    let mut size_bytes = 0;
    
    let mut stack = vec![temp_dir];
    while let Some(path) = stack.pop() {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                if let Ok(metadata) = entry.metadata() {
                    if metadata.is_dir() {
                        dirs += 1;
                        stack.push(entry.path());
                    } else {
                        files += 1;
                        size_bytes += metadata.len();
                    }
                }
            }
        }
    }

    Ok(TempInfo { files, dirs, size_bytes })
}

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

pub fn clear_temp_folder(app: AppHandle) -> Result<String, String> {
    let temp_dir = std::env::temp_dir();
    let mut deleted_files = 0;
    let mut deleted_dirs = 0;
    
    // Quick scan to get total files for progress calculation
    let mut total_files = 0;
    let mut stack = vec![temp_dir.clone()];
    let mut all_paths = Vec::new();
    
    while let Some(path) = stack.pop() {
        if let Ok(entries) = fs::read_dir(&path) {
            for entry in entries.flatten() {
                if let Ok(metadata) = entry.metadata() {
                    all_paths.push((entry.path(), metadata.is_dir()));
                    if metadata.is_dir() {
                        stack.push(entry.path());
                    } else {
                        total_files += 1;
                    }
                }
            }
        }
    }
    
    let mut processed_files = 0;
    let mut dirs_to_delete = Vec::new();
    
    for (path, is_dir) in all_paths {
        if is_dir {
            dirs_to_delete.push(path);
        } else {
            processed_files += 1;
            
            // Emit progress every 50 files or on the last file to avoid spamming the IPC
            if processed_files % 50 == 0 || processed_files == total_files {
                let percentage = if total_files > 0 {
                    ((processed_files as f64 / total_files as f64) * 100.0) as u32
                } else {
                    100
                };
                
                let _ = app.emit("temp-clean-progress", TempProgress {
                    percentage,
                    current_file: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                });
            }
            
            if fs::remove_file(&path).is_ok() {
                deleted_files += 1;
            }
        }
    }
    
    // Second pass: Delete empty directories from bottom to top (longest paths first)
    dirs_to_delete.sort_by_key(|a| std::cmp::Reverse(a.components().count()));
    for dir in dirs_to_delete {
        if fs::remove_dir(&dir).is_ok() {
            deleted_dirs += 1;
        }
    }
    
    // Emit final 100% just in case
    let _ = app.emit("temp-clean-progress", TempProgress {
        percentage: 100,
        current_file: "Finished cleaning.".to_string(),
    });
    
    Ok(format!("Cleared {} files and {} directories from Temp.", deleted_files, deleted_dirs))
}
