mod system;
mod memory;
mod tweaker;
mod gpu;
use system::{HardwareInfo, SystemMonitor, SystemStats};
use memory::{AutoPurger, purge_standby_list};
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

#[tauri::command]
fn purge_memory_now() -> Result<(), String> {
    log::info!("Manual memory purge requested.");
    purge_standby_list()
}

#[tauri::command]
fn set_auto_purge_threshold(state: State<'_, AutoPurger>, mb: u64) {
    let mut s = state.state.lock().unwrap();
    s.threshold_mb = mb;
    log::info!("Auto-purge threshold set to {} MB", mb);
}

#[tauri::command]
fn toggle_auto_purge(state: State<'_, AutoPurger>, enabled: bool) {
    let mut s = state.state.lock().unwrap();
    s.enabled = enabled;
    log::info!("Auto-purge enabled: {}", enabled);
}

#[tauri::command]
fn get_auto_purge_state(state: State<'_, AutoPurger>) -> (bool, u64) {
    let s = state.state.lock().unwrap();
    (s.enabled, s.threshold_mb)
}

#[tauri::command]
fn apply_ultimate_power_plan() -> Result<String, String> {
    tweaker::enable_ultimate_power_plan()
}

#[tauri::command]
fn apply_core_parking_disable() -> Result<String, String> {
    tweaker::disable_core_parking()
}

#[tauri::command]
fn fetch_hags_status() -> Result<bool, String> {
    gpu::fetch_hags_status()
}

#[tauri::command]
fn apply_hags_setting(enabled: bool) -> Result<String, String> {
    gpu::apply_hags_setting(enabled)
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
    .manage(AutoPurger::new())
    .invoke_handler(tauri::generate_handler![
        get_hardware_info, get_system_stats,
        purge_memory_now, set_auto_purge_threshold, toggle_auto_purge, get_auto_purge_state,
        apply_ultimate_power_plan, apply_core_parking_disable,
        fetch_hags_status, apply_hags_setting
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
