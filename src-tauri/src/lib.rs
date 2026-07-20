mod system;
use system::{HardwareInfo, SystemMonitor, SystemStats};
use tauri::State;

#[tauri::command]
fn get_hardware_info(state: State<'_, SystemMonitor>) -> HardwareInfo {
    state.hw_info.clone()
}

#[tauri::command]
fn get_system_stats(state: State<'_, SystemMonitor>) -> SystemStats {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_cpu_usage();
    sys.refresh_memory();

    SystemStats {
        cpu_usage: sys.global_cpu_usage(),
        total_memory: sys.total_memory(),
        used_memory: sys.used_memory(),
        available_memory: sys.available_memory(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .manage(SystemMonitor::new())
    .invoke_handler(tauri::generate_handler![get_hardware_info, get_system_stats])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
