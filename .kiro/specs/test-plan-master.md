# Master Test Plan - XMOST-OPTIMIZER

## Overview
Test plan untuk validasi setiap modul SEBELUM implementasi UI. Semua tests harus pass sebelum proceed ke frontend development.

## Test Environment Setup

### Prerequisites
- Windows 10 (1909+) atau Windows 11
- Administrator privileges
- Rust 1.70+
- Visual Studio Build Tools 2019+

### Test Data Requirements
- CPU: Intel atau AMD multi-core processor
- RAM: Minimum 8GB (16GB+ recommended untuk memory tests)
- GPU: NVIDIA atau AMD discrete GPU (untuk GPU module tests)

## Module Validation Sequence

### Phase 1: Foundation Modules (Week 1)
1. **Utils & Types** (Day 1)
   - Privilege check
   - Error handling
   - NTAPI wrappers
   - Windows version detection

2. **Windows Core & CPU Tweaker** (Day 2-3)
   - CPU affinity
   - Power plan switching
   - Service management

### Phase 2: Core Features (Week 2)
3. **Dashboard & System Monitor** (Day 1-2)
   - WMI queries
   - Memory monitoring
   - Temperature sensors

4. **Memory Orchestrator** (Day 3-4)
   - NTAPI memory purge
   - Auto-purge service
   - Timer resolution

### Phase 3: Advanced Features (Week 3)
5. **GPU Control Bridge** (Day 1-2)
   - HAGS registry
   - Vendor detection
   - NVIDIA/AMD APIs

6. **XMost Smart Advisor** (Day 3-4)
   - Metrics collection
   - AI API integration
   - Response parsing

## Detailed Test Plans

### Module 1: Dashboard & System Monitor

#### Unit Tests (20 tests)
```bash
cd src-tauri
cargo test --package xmost-optimizer --lib modules::dashboard
```

**Test Coverage**:
- [ ] `test_wmi_connection_success()` - WMI initialization
- [ ] `test_get_cpu_info()` - CPU name, cores, threads
- [ ] `test_get_gpu_info()` - GPU name, VRAM
- [ ] `test_get_motherboard_info()` - Motherboard model
- [ ] `test_memory_stats_valid_range()` - Total, used, standby
- [ ] `test_memory_usage_percentage()` - 0-100 range
- [ ] `test_temperature_sensor_optional()` - Handle None gracefully
- [ ] `test_cpu_temp_range()` - 0-120°C if present
- [ ] `test_gpu_temp_range()` - 0-120°C if present
- [ ] `test_polling_loop_no_memory_leak()` - 1000 iterations
- [ ] `test_hardware_info_serialization()` - JSON serialize
- [ ] `test_memory_stats_serialization()` - JSON serialize
- [ ] `test_temperature_data_serialization()` - JSON serialize
- [ ] `test_system_info_caching()` - Static data cached
- [ ] `test_realtime_data_refresh()` - Dynamic data updates
- [ ] `test_wmi_query_timeout()` - Handle timeout gracefully
- [ ] `test_invalid_wmi_class()` - Handle invalid class
- [ ] `test_permission_denied_wmi()` - Error handling
- [ ] `test_concurrent_wmi_queries()` - Thread safety
- [ ] `test_standby_list_detection_accuracy()` - Compare with RAMMap

**Expected Results**:
- All 20 tests PASS
- No memory leaks dalam polling loop
- WMI queries < 500ms average

#### Integration Tests (5 tests)
```bash
cargo test --test integration_dashboard -- --test-threads=1
```

- [ ] `test_tauri_command_get_system_info()` - Mock Tauri invoke
- [ ] `test_tauri_command_get_memory_stats()` - Mock Tauri invoke
- [ ] `test_tauri_command_get_temperatures()` - Mock Tauri invoke
- [ ] `test_polling_via_tauri_bridge()` - Simulate frontend polling
- [ ] `test_error_propagation_to_frontend()` - Error messages

**Expected Results**:
- Commands return valid JSON
- Errors propagate as String
- Response time < 100ms per command

#### Manual Validation (Pre-UI)
1. [ ] Build Tauri app: `cargo tauri dev`
2. [ ] Open browser console, invoke commands manually:
   ```javascript
   await invoke('get_system_info')
   await invoke('get_memory_stats')
   await invoke('get_temperatures')
   ```
3. [ ] Compare hasil dengan:
   - Task Manager (memory stats)
   - CPU-Z (CPU info)
   - GPU-Z (GPU info)
   - HWiNFO (temperatures)
4. [ ] Monitor RAM usage selama 5 menit polling (should be stable)

**Acceptance Criteria**:
- ✅ CPU name matches CPU-Z
- ✅ RAM total matches Task Manager
- ✅ GPU VRAM matches GPU-Z
- ✅ Standby list ±10% accuracy vs RAMMap
- ✅ No memory leak (process RAM stable)

---

### Module 2: Memory Orchestrator

#### Unit Tests (25 tests)
```bash
cargo test --package xmost-optimizer --lib modules::memory_orchestrator
```

**Test Coverage**:
- [ ] `test_privilege_check_before_purge()` - Admin check
- [ ] `test_ntapi_function_pointer_valid()` - NtSetSystemInformation loads
- [ ] `test_purge_standby_list_success()` - Returns freed MB
- [ ] `test_purge_returns_non_zero()` - Freed MB > 0
- [ ] `test_purge_error_no_admin()` - Error if not admin
- [ ] `test_purge_error_invalid_command()` - Invalid command rejected
- [ ] `test_auto_purge_disabled_by_default()` - Config default
- [ ] `test_auto_purge_config_serialization()` - JSON serialize
- [ ] `test_auto_purge_threshold_validation()` - Threshold > 0
- [ ] `test_auto_purge_interval_validation()` - Interval >= 1000ms
- [ ] `test_auto_purge_start_creates_thread()` - Background task spawns
- [ ] `test_auto_purge_stop_graceful()` - Shutdown cleanly
- [ ] `test_auto_purge_triggers_at_threshold()` - Mock standby >= threshold
- [ ] `test_auto_purge_respects_interval()` - Check only per interval
- [ ] `test_auto_purge_disabled_no_trigger()` - Disabled = no purge
- [ ] `test_timer_resolution_query()` - NtQueryTimerResolution works
- [ ] `test_timer_resolution_set_valid()` - Set 5000us (0.5ms)
- [ ] `test_timer_resolution_restore()` - Restore on drop
- [ ] `test_timer_resolution_invalid_value()` - Reject invalid values
- [ ] `test_timer_resolution_multiple_sets()` - Override previous
- [ ] `test_memory_purger_rate_limit()` - Cannot purge twice in 1s
- [ ] `test_memory_purger_last_purge_time()` - Track timestamp
- [ ] `test_ntstatus_error_conversion()` - NTSTATUS to error enum
- [ ] `test_retry_logic_transient_error()` - Retry on buffer too small
- [ ] `test_retry_logic_permanent_error()` - No retry on permission denied

**Expected Results**:
- All 25 tests PASS
- NTAPI calls return correct status codes
- Auto-purge service starts/stops cleanly

#### Integration Tests (8 tests)
```bash
cargo test --test integration_memory -- --test-threads=1 --ignored
```

- [ ] `test_manual_purge_via_tauri()` - Invoke command, check freed MB
- [ ] `test_manual_purge_reflects_in_stats()` - Standby decreases
- [ ] `test_auto_purge_full_cycle()` - Enable, wait for trigger, verify
- [ ] `test_auto_purge_config_update_runtime()` - Change threshold live
- [ ] `test_timer_resolution_set_query()` - Set, then query to verify
- [ ] `test_timer_resolution_restore_on_exit()` - Close app, check restored
- [ ] `test_permission_denied_error_propagation()` - Frontend receives error
- [ ] `test_concurrent_purge_requests()` - Handle multiple invokes

**Expected Results**:
- Manual purge frees > 100MB (if standby >= 500MB)
- Auto-purge triggers within 10s of threshold
- Timer resolution set to 5000us confirmed via ClockRes

#### Manual Validation (Pre-UI)
1. [ ] Run as Admin: `cargo tauri dev`
2. [ ] Fill RAM dengan Chrome tabs (open 20+ tabs)
3. [ ] Check standby list size: `RAMMap.exe` dari Sysinternals
4. [ ] Invoke manual purge:
   ```javascript
   let freed = await invoke('purge_memory_manual')
   console.log(`Freed: ${freed} MB`)
   ```
5. [ ] Verify standby list decreased dalam RAMMap
6. [ ] Enable auto-purge dengan threshold 2GB:
   ```javascript
   await invoke('set_auto_purge_config', {
     config: { enabled: true, threshold_mb: 2048, check_interval_ms: 5000 }
   })
   await invoke('start_auto_purge')
   ```
7. [ ] Monitor logs, verify auto-trigger when standby > 2GB
8. [ ] Set timer resolution:
   ```javascript
   let current = await invoke('set_timer_resolution', { resolution_us: 5000 })
   console.log(`Current: ${current}us`)
   ```
9. [ ] Verify dengan `ClockRes.exe` dari Sysinternals (should show 0.5ms)
10. [ ] Close app, verify timer restored (ClockRes should show default 15.6ms)

**Acceptance Criteria**:
- ✅ Manual purge frees standby memory (visible dalam RAMMap)
- ✅ Auto-purge triggers automatically at threshold
- ✅ Timer resolution set to 0.5ms (confirmed via ClockRes)
- ✅ Timer resolution restored on app exit
- ✅ No crashes or freezes during operations


---

### Module 3: Windows Core & CPU Tweaker

#### Unit Tests (22 tests)
```bash
cargo test --package xmost-optimizer --lib modules::windows_tweaker
```

**Test Coverage**:
- [ ] `test_cores_to_mask_single_core()` - [0] -> 0b1
- [ ] `test_cores_to_mask_multiple_cores()` - [0,2,4] -> 0b10101
- [ ] `test_cores_to_mask_all_cores()` - [0..15] -> 0xFFFF
- [ ] `test_mask_to_cores_conversion()` - 0b10101 -> [0,2,4]
- [ ] `test_set_affinity_self_process()` - Set untuk current process
- [ ] `test_get_affinity_returns_valid()` - Query current process
- [ ] `test_set_affinity_invalid_pid()` - Error for non-existent PID
- [ ] `test_affinity_mask_zero_rejected()` - Cannot set 0 cores
- [ ] `test_power_plan_get_active()` - Returns GUID format
- [ ] `test_power_plan_guid_validation()` - Validate format
- [ ] `test_power_plan_set_balanced()` - Switch to Balanced
- [ ] `test_power_plan_set_high_performance()` - Switch to High Perf
- [ ] `test_ultimate_performance_creation()` - Duplicate if not exists
- [ ] `test_power_plan_invalid_guid_rejected()` - Error for invalid GUID
- [ ] `test_service_whitelist_enforced()` - Reject unlisted service
- [ ] `test_service_get_state_sysmain()` - Query SysMain
- [ ] `test_service_get_state_wuauserv()` - Query Windows Update
- [ ] `test_service_state_enum_parsing()` - Parse "RUNNING" etc
- [ ] `test_service_stop_success()` - Stop allowed service
- [ ] `test_service_start_success()` - Start allowed service
- [ ] `test_service_not_found_error()` - Handle non-existent
- [ ] `test_service_permission_denied()` - Error if not admin

**Expected Results**:
- All 22 tests PASS
- Affinity conversion logic correct
- Power plan GUID validation works
- Service whitelist enforced

#### Integration Tests (10 tests)
```bash
cargo test --test integration_tweaker -- --test-threads=1 --ignored
```

- [ ] `test_set_affinity_notepad()` - Launch Notepad, set affinity
- [ ] `test_affinity_persists()` - Verify affinity via Task Manager API
- [ ] `test_power_plan_switch_cycle()` - Balanced -> High -> Ultimate
- [ ] `test_power_plan_verify_active()` - Check via powercfg
- [ ] `test_ultimate_performance_boost()` - Measure CPU frequency increase
- [ ] `test_service_sysmain_toggle()` - Stop -> verify -> start
- [ ] `test_service_state_persists()` - Check after toggle
- [ ] `test_service_wuauserv_toggle()` - Stop -> verify -> start
- [ ] `test_multiple_services_independent()` - Toggle both independently
- [ ] `test_permission_error_propagation()` - Frontend receives error

**Expected Results**:
- Affinity set successfully (verify via Task Manager)
- Power plan switches (verify via `powercfg /getactivescheme`)
- Services toggle (verify via `sc query`)

#### Manual Validation (Pre-UI)
1. [ ] Run as Admin: `cargo tauri dev`
2. [ ] **Test CPU Affinity**:
   - Launch Notepad, get PID dari Task Manager
   - Invoke:
     ```javascript
     await invoke('set_process_affinity', {
       pid: <notepad_pid>,
       coreIndices: [0, 2, 4, 6] // Even cores only
     })
     ```
   - Open Task Manager -> Details -> Right-click Notepad -> Set Affinity
   - Verify only cores 0,2,4,6 checked
3. [ ] **Test Power Plans**:
   - Get current plan:
     ```javascript
     let current = await invoke('get_active_power_plan')
     console.log(current)
     ```
   - Switch to Ultimate Performance:
     ```javascript
     await invoke('set_ultimate_performance')
     ```
   - Verify dengan CMD: `powercfg /getactivescheme`
   - Should show "Ultimate Performance"
4. [ ] **Test Service Toggling**:
   - Check SysMain state:
     ```javascript
     let state = await invoke('get_service_state', { serviceName: 'SysMain' })
     console.log(state) // Should be "Running" or "Stopped"
     ```
   - Toggle off:
     ```javascript
     await invoke('toggle_service', { serviceName: 'SysMain', enable: false })
     ```
   - Verify dengan CMD: `sc query SysMain` (should show STOPPED)
   - Toggle back on:
     ```javascript
     await invoke('toggle_service', { serviceName: 'SysMain', enable: true })
     ```

**Acceptance Criteria**:
- ✅ Process affinity set correctly (Task Manager confirms)
- ✅ Power plan switches successfully (powercfg confirms)
- ✅ Ultimate Performance created if not exists
- ✅ Services toggle on/off (sc query confirms)
- ✅ Whitelist blocks unlisted services
- ✅ Permission errors propagate to frontend

---

### Module 4: GPU Control Bridge

#### Unit Tests (18 tests)
```bash
cargo test --package xmost-optimizer --lib modules::gpu_bridge
```

**Test Coverage**:
- [ ] `test_hags_registry_path_exists()` - Registry key readable
- [ ] `test_hags_get_state()` - Read HwSchMode value
- [ ] `test_hags_set_enabled()` - Write value = 1
- [ ] `test_hags_set_disabled()` - Write value = 2
- [ ] `test_hags_permission_denied()` - Error if not admin
- [ ] `test_gpu_vendor_detect_nvidia()` - "NVIDIA" in GPU name
- [ ] `test_gpu_vendor_detect_amd()` - "AMD" in GPU name
- [ ] `test_gpu_vendor_detect_intel()` - "Intel" in GPU name
- [ ] `test_gpu_vendor_unknown_fallback()` - Unknown GPU handled
- [ ] `test_nvidia_nvml_init()` - NVML library loads (if NVIDIA GPU)
- [ ] `test_nvidia_get_clocks()` - Query GPU/mem clocks (if NVIDIA)
- [ ] `test_nvidia_set_power_mode()` - Set mode (if NVIDIA)
- [ ] `test_nvidia_unavailable_graceful()` - Handle no NVIDIA
- [ ] `test_amd_adl_library_load()` - Load atiadlxx.dll (if AMD GPU)
- [ ] `test_amd_set_power_limit_valid()` - Accept -50 to +50
- [ ] `test_amd_set_power_limit_invalid()` - Reject out of range
- [ ] `test_amd_unavailable_graceful()` - Handle no AMD
- [ ] `test_gpu_bridge_vendor_routing()` - Route calls based on vendor

**Expected Results**:
- All 18 tests PASS (some may skip jika GPU vendor tidak match)
- HAGS registry read/write works
- Vendor detection accurate
- API libraries load gracefully

#### Integration Tests (7 tests)
```bash
cargo test --test integration_gpu -- --test-threads=1 --ignored
```

- [ ] `test_hags_toggle_via_tauri()` - Set enabled, verify registry
- [ ] `test_hags_requires_reboot_flag()` - Frontend shows reboot warning
- [ ] `test_gpu_vendor_detection()` - Matches actual GPU
- [ ] `test_nvidia_power_mode_switch()` - Set max performance (NVIDIA only)
- [ ] `test_nvidia_clocks_query()` - Get clocks (NVIDIA only)
- [ ] `test_amd_power_profile_switch()` - Set performance (AMD only)
- [ ] `test_permission_error_registry()` - Error if not admin

**Expected Results**:
- HAGS toggle writes registry correctly
- GPU vendor detected matches hardware
- Power mode commands execute without crash

#### Manual Validation (Pre-UI)
1. [ ] Run as Admin: `cargo tauri dev`
2. [ ] **Test GPU Detection**:
   ```javascript
   let vendor = await invoke('get_gpu_vendor')
   console.log(vendor) // Should be "Nvidia", "Amd", "Intel", or "Unknown"
   ```
3. [ ] **Test HAGS** (Windows 10 2004+ only):
   - Get current state:
     ```javascript
     let hags = await invoke('get_hags_state')
     console.log(`HAGS enabled: ${hags}`)
     ```
   - Toggle HAGS:
     ```javascript
     await invoke('set_hags_state', { enabled: true })
     ```
   - Verify registry:
     - Open regedit
     - Navigate to: `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\GraphicsDrivers`
     - Check `HwSchMode` value (1 = enabled, 2 = disabled)
   - **NOTE**: Reboot required untuk apply
4. [ ] **Test NVIDIA GPU** (if applicable):
   ```javascript
   let clocks = await invoke('get_nvidia_clocks')
   console.log(`GPU: ${clocks[0]} MHz, Memory: ${clocks[1]} MHz`)
   
   await invoke('set_gpu_performance_mode', { mode: 'max_performance' })
   ```
   - Verify dengan `nvidia-smi` or GPU-Z (clocks should stay higher)
5. [ ] **Test AMD GPU** (if applicable):
   ```javascript
   await invoke('set_gpu_performance_mode', { mode: 'performance' })
   ```
   - Verify dengan Radeon Software (profile should change)

**Acceptance Criteria**:
- ✅ GPU vendor detected correctly (matches hardware)
- ✅ HAGS toggle writes registry value (regedit confirms)
- ✅ NVIDIA power mode sets successfully (nvidia-smi confirms)
- ✅ AMD power mode sets successfully (Radeon Software confirms)
- ✅ Graceful degradation if GPU vendor tidak supported
- ✅ Permission errors propagate to frontend

---

### Module 5: XMost Smart Advisor

#### Unit Tests (15 tests)
```bash
cargo test --package xmost-optimizer --lib modules::smart_advisor
```

**Test Coverage**:
- [ ] `test_metrics_collector_snapshot()` - Collect all metrics
- [ ] `test_snapshot_serialization()` - JSON serialize snapshot
- [ ] `test_snapshot_timestamp_recent()` - Timestamp valid
- [ ] `test_user_context_required()` - use_case cannot be empty
- [ ] `test_hardware_metrics_populated()` - All HW fields present
- [ ] `test_memory_metrics_populated()` - All memory fields present
- [ ] `test_cpu_metrics_populated()` - All CPU fields present
- [ ] `test_gpu_metrics_populated()` - All GPU fields present
- [ ] `test_ai_client_gemini_request_format()` - Correct JSON structure
- [ ] `test_ai_client_groq_request_format()` - OpenAI-compatible
- [ ] `test_recommendation_parser_valid_json()` - Parse standard JSON
- [ ] `test_recommendation_parser_markdown()` - Extract from ```json
- [ ] `test_recommendation_parser_fallback()` - Handle plain text
- [ ] `test_recommendation_validation()` - Reject empty/invalid
- [ ] `test_performance_score_range()` - 0-100 range

**Expected Results**:
- All 15 tests PASS
- Snapshot collects dari all modules
- Parser handles multiple response formats

#### Integration Tests (6 tests)
```bash
cargo test --test integration_advisor -- --test-threads=1 --ignored
```

- [ ] `test_end_to_end_with_mock_ai()` - Full flow dengan mock response
- [ ] `test_gemini_api_real_call()` - Call Gemini (requires API key)
- [ ] `test_groq_api_fallback()` - Call Groq as fallback
- [ ] `test_api_error_handling()` - Handle 401, 429, 500
- [ ] `test_response_parsing_integration()` - Parse real AI response
- [ ] `test_recommendations_to_frontend()` - Return to Tauri

**Expected Results**:
- Mock flow works end-to-end
- Real API calls return recommendations (with valid key)
- Errors handled gracefully

#### Manual Validation (Pre-UI)
1. [ ] Get API key:
   - Gemini: https://makersuite.google.com/app/apikey
   - Groq: https://console.groq.com
2. [ ] Set API config:
   ```javascript
   await invoke('set_ai_config', {
     apiKey: 'YOUR_API_KEY',
     apiProvider: 'gemini' // or 'groq'
   })
   ```
3. [ ] Run analysis:
   ```javascript
   let result = await invoke('get_smart_recommendations', {
     useCase: 'gaming',
     targetApps: ['game.exe', 'Discord.exe']
   })
   console.log(JSON.stringify(result, null, 2))
   ```
4. [ ] Verify response structure:
   - `summary` (string)
   - `recommendations` (array)
   - `performance_score` (0-100)
5. [ ] Review recommendations untuk relevance
6. [ ] Test error scenarios:
   - Invalid API key -> Should error with "Invalid API key"
   - No internet -> Should error with "Request timeout"
   - Rate limit -> Should error with "Too many requests"

**Acceptance Criteria**:
- ✅ Metrics snapshot collects dari all modules
- ✅ AI API returns structured recommendations
- ✅ Recommendations relevant untuk use case
- ✅ Performance score sensible (50-100 range typical)
- ✅ Parser handles various response formats
- ✅ Error messages user-friendly

---

## Cross-Module Integration Tests

### System-Wide Tests (10 tests)
```bash
cargo test --test integration_system -- --test-threads=1 --ignored
```

**Test Coverage**:
- [ ] `test_all_modules_init_success()` - All modules initialize
- [ ] `test_dashboard_feeds_advisor()` - Advisor uses dashboard data
- [ ] `test_memory_purge_reflects_dashboard()` - Dashboard shows freed memory
- [ ] `test_gpu_detection_consistent()` - GPU vendor matches across modules
- [ ] `test_power_plan_affects_cpu_metrics()` - CPU metrics reflect power plan
- [ ] `test_concurrent_operations()` - Multiple modules operate simultaneously
- [ ] `test_error_isolation()` - Module error doesn't crash others
- [ ] `test_global_state_thread_safety()` - GPU_BRIDGE, AI_CLIENT concurrent access
- [ ] `test_app_startup_sequence()` - Privilege check -> module init -> ready
- [ ] `test_app_shutdown_cleanup()` - Timer resolution restored, services reset

**Expected Results**:
- All modules work together
- Data flows correctly between modules
- No race conditions
- Clean shutdown

---

## Performance Benchmarks

### Targets
- **Dashboard polling**: < 100ms per cycle
- **Memory purge**: < 500ms end-to-end
- **Power plan switch**: < 200ms
- **Service toggle**: < 1000ms
- **GPU mode switch**: < 500ms
- **AI recommendation**: < 10s total

### Benchmark Tests
```bash
cargo bench --bench performance_tests
```

**Coverage**:
- [ ] Benchmark WMI query speed
- [ ] Benchmark NTAPI call latency
- [ ] Benchmark IPC command roundtrip
- [ ] Benchmark JSON serialization overhead
- [ ] Benchmark concurrent command throughput

---

## Acceptance Criteria Summary

### Module 1: Dashboard ✅
- [ ] All unit tests pass (20/20)
- [ ] All integration tests pass (5/5)
- [ ] Manual validation complete
- [ ] Data accuracy within 10% of reference tools
- [ ] No memory leaks

### Module 2: Memory Orchestrator ✅
- [ ] All unit tests pass (25/25)
- [ ] All integration tests pass (8/8)
- [ ] Manual validation complete
- [ ] Memory purge verified (RAMMap)
- [ ] Timer resolution verified (ClockRes)
- [ ] Auto-purge service stable

### Module 3: Windows Tweaker ✅
- [ ] All unit tests pass (22/22)
- [ ] All integration tests pass (10/10)
- [ ] Manual validation complete
- [ ] Affinity verified (Task Manager)
- [ ] Power plan verified (powercfg)
- [ ] Services verified (sc query)

### Module 4: GPU Bridge ✅
- [ ] All unit tests pass (18/18)
- [ ] All integration tests pass (7/7)
- [ ] Manual validation complete
- [ ] HAGS verified (regedit)
- [ ] GPU vendor detection accurate
- [ ] Power modes work (vendor tools)

### Module 5: Smart Advisor ✅
- [ ] All unit tests pass (15/15)
- [ ] All integration tests pass (6/6)
- [ ] Manual validation complete
- [ ] AI API integration working
- [ ] Recommendations relevant
- [ ] Performance < 10s

### Cross-Module Integration ✅
- [ ] All system tests pass (10/10)
- [ ] Performance benchmarks meet targets
- [ ] Concurrent operations stable
- [ ] Clean startup/shutdown

---

## Test Execution Schedule

### Week 1: Foundation
- **Day 1-2**: Module 3 (Windows Tweaker) - 32 tests
- **Day 3**: Utils & Types validation

### Week 2: Core Features  
- **Day 1-2**: Module 1 (Dashboard) - 25 tests
- **Day 3-4**: Module 2 (Memory Orchestrator) - 33 tests

### Week 3: Advanced Features
- **Day 1-2**: Module 4 (GPU Bridge) - 25 tests
- **Day 3-4**: Module 5 (Smart Advisor) - 21 tests

### Week 4: Integration & Performance
- **Day 1-2**: Cross-module integration - 10 tests
- **Day 3**: Performance benchmarks
- **Day 4**: Final validation & documentation

**Total Tests**: ~150 automated + ~30 manual validation steps

---

## Bug Tracking Template

### Issue Template
```
Title: [Module Name] Brief description
Priority: Critical | High | Medium | Low
Type: Bug | Performance | Security

Environment:
- Windows Version: 
- CPU: 
- RAM: 
- GPU: 

Steps to Reproduce:
1. 
2. 
3. 

Expected Behavior:


Actual Behavior:


Logs/Screenshots:


Additional Context:

```

---

## Sign-Off Checklist

Sebelum proceed ke UI implementation:

- [ ] All 5 modules pass unit tests (100% pass rate)
- [ ] All integration tests pass
- [ ] Manual validation complete untuk each module
- [ ] Performance benchmarks meet targets
- [ ] No memory leaks detected
- [ ] No security vulnerabilities
- [ ] Documentation complete
- [ ] Steering files validated
- [ ] Code review completed
- [ ] Test coverage >= 80%

**Sign-Off**: _________________ Date: _________________
