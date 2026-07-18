# XMOST-OPTIMIZER Implementation Tasks

## Overview
Task breakdown untuk implementasi XMOST-OPTIMIZER dengan 5 modul utama. Follow dependency order untuk sequential implementation.

---

## Phase 0: Project Setup

### Environment Setup
- [ ] Install Rust toolchain (1.70+)
- [ ] Install Node.js (16+) dan npm
- [ ] Install Visual Studio Build Tools 2019+
- [ ] Install Tauri CLI: `cargo install tauri-cli`
- [ ] Verify admin access pada development machine

### Project Initialization
- [ ] Initialize Tauri project: `cargo tauri init`
- [ ] Setup React frontend dengan Vite
- [ ] Configure Tailwind CSS
- [ ] Setup project structure (folders: modules, utils, types)
- [ ] Configure Cargo.toml dengan all dependencies
- [ ] Configure tauri.conf.json dengan `requestedExecutionLevel: "requireAdministrator"`
- [ ] Setup Git repository dan .gitignore
- [ ] Create initial commit

**Estimated Time**: 4 hours

---

## Phase 1: Foundation (Week 1)

### Task 1.1: Utils & Types Layer
**Dependencies**: None  
**Priority**: Critical

#### Subtasks:
- [ ] Create `src-tauri/src/types/mod.rs`
  - [ ] Define `ntstatus.rs` dengan NTSTATUS constants
  - [ ] Define `errors.rs` dengan NtApiError enum
  - [ ] Define `system_info.rs` dengan data structures
- [ ] Create `src-tauri/src/utils/mod.rs`
  - [ ] Implement `privilege_check.rs` (is_elevated, require_elevation_or_exit)
  - [ ] Implement `error_handler.rs` (error conversion functions)
  - [ ] Implement `ntapi_safe.rs` (call_ntapi wrapper)
  - [ ] Implement `retry.rs` (retry_ntapi dengan exponential backoff)
  - [ ] Implement `windows_version.rs` (OS version detection)
- [ ] Write unit tests untuk all utility functions (30+ tests)
- [ ] Validate privilege check works via `cargo test`

**Acceptance Criteria**:
- All unit tests pass
- Privilege check correctly detects admin status
- Error types implement Display trait
- NTAPI wrapper handles success/error cases

**Estimated Time**: 8 hours

---

### Task 1.2: Module 3 - Windows Core & CPU Tweaker
**Dependencies**: Task 1.1 (Utils)  
**Priority**: High (foundation untuk other modules)

#### Subtasks:
- [ ] Create `src-tauri/src/modules/windows_tweaker/mod.rs`
- [ ] Implement `cpu_affinity.rs`:
  - [ ] AffinityManager struct
  - [ ] set_process_affinity() function
  - [ ] get_process_affinity() function
  - [ ] cores_to_mask() helper
  - [ ] mask_to_cores() helper
- [ ] Implement `power_plan.rs`:
  - [ ] PowerPlanManager struct
  - [ ] get_active_plan() function
  - [ ] set_power_plan() function
  - [ ] set_ultimate_performance() function
  - [ ] ensure_ultimate_performance_exists() helper
- [ ] Implement `service_manager.rs`:
  - [ ] ServiceManager struct dengan whitelist
  - [ ] get_service_state() function
  - [ ] stop_service() function
  - [ ] start_service() function
  - [ ] set_service_startup() function
- [ ] Add Tauri commands (7 commands):
  - [ ] `set_process_affinity`
  - [ ] `get_process_affinity`
  - [ ] `get_active_power_plan`
  - [ ] `set_power_plan`
  - [ ] `set_ultimate_performance`
  - [ ] `get_service_state`
  - [ ] `toggle_service`
- [ ] Write unit tests (22 tests)
- [ ] Write integration tests (10 tests)
- [ ] Manual validation (Task Manager, powercfg, sc query)

**Acceptance Criteria**:
- All 32 tests pass
- Affinity sets correctly (verified via Task Manager)
- Power plan switches (verified via powercfg)
- Services toggle (verified via sc query)

**Estimated Time**: 16 hours

---

## Phase 2: Core Features (Week 2)

### Task 2.1: Module 1 - Dashboard & System Monitor
**Dependencies**: Task 1.1 (Utils)  
**Priority**: High

#### Subtasks:
- [ ] Create `src-tauri/src/modules/dashboard/mod.rs`
- [ ] Implement `wmi_provider.rs`:
  - [ ] Initialize WMI connection
  - [ ] Query Win32_Processor
  - [ ] Query Win32_VideoController
  - [ ] Query Win32_BaseBoard
  - [ ] Query Win32_PerfFormattedData_PerfOS_Memory
- [ ] Implement `system_info.rs`:
  - [ ] HardwareInfo struct
  - [ ] get_hardware_info() function
  - [ ] Cache static hardware data
- [ ] Implement `realtime_monitor.rs`:
  - [ ] MemoryStats struct
  - [ ] TemperatureData struct
  - [ ] get_memory_stats() function
  - [ ] get_temperatures() function
  - [ ] Polling loop implementation
- [ ] Add Tauri commands (3 commands):
  - [ ] `get_system_info`
  - [ ] `get_memory_stats`
  - [ ] `get_temperatures`
- [ ] Write unit tests (20 tests)
- [ ] Write integration tests (5 tests)
- [ ] Manual validation (compare dengan Task Manager, CPU-Z, GPU-Z)

**Acceptance Criteria**:
- All 25 tests pass
- Data accuracy within 10% of reference tools
- No memory leaks dalam polling (verify via 5 min test)
- WMI queries < 500ms average

**Estimated Time**: 12 hours

---

### Task 2.2: Module 2 - Memory Orchestrator
**Dependencies**: Task 1.1 (Utils), Task 2.1 (Dashboard untuk metrics)  
**Priority**: Critical

#### Subtasks:
- [ ] Create `src-tauri/src/modules/memory_orchestrator/mod.rs`
- [ ] Implement `ntapi_wrapper.rs`:
  - [ ] Load ntdll.dll dynamically
  - [ ] Get NtSetSystemInformation function pointer
  - [ ] MemoryPurger struct
  - [ ] purge_standby_list() function
  - [ ] get_standby_size_mb() helper
- [ ] Implement `purge_engine.rs`:
  - [ ] AutoPurgeConfig struct (with Default)
  - [ ] AutoPurgeService struct
  - [ ] start() method (tokio background task)
  - [ ] stop() method (graceful shutdown)
  - [ ] update_config() method
  - [ ] Threshold checking logic
- [ ] Implement `timer_resolution.rs`:
  - [ ] Load NtSetTimerResolution / NtQueryTimerResolution
  - [ ] TimerResolutionManager struct
  - [ ] set_resolution() method
  - [ ] restore_original() method
  - [ ] Drop trait implementation (auto-restore)
- [ ] Add Tauri commands (6 commands):
  - [ ] `purge_memory_manual`
  - [ ] `set_auto_purge_config`
  - [ ] `start_auto_purge`
  - [ ] `stop_auto_purge`
  - [ ] `set_timer_resolution`
  - [ ] `restore_timer_resolution`
- [ ] Write unit tests (25 tests)
- [ ] Write integration tests (8 tests)
- [ ] Manual validation (RAMMap, ClockRes)

**Acceptance Criteria**:
- All 33 tests pass
- Memory purge frees standby list (RAMMap confirms)
- Auto-purge triggers at threshold
- Timer resolution sets to 0.5ms (ClockRes confirms)
- Timer restores on app exit

**Estimated Time**: 16 hours

---

## Phase 3: Advanced Features (Week 3)

### Task 3.1: Module 4 - GPU Control Bridge
**Dependencies**: Task 1.1 (Utils), Task 2.1 (Dashboard untuk GPU detection)  
**Priority**: Medium

#### Subtasks:
- [ ] Create `src-tauri/src/modules/gpu_bridge/mod.rs`
- [ ] Implement `registry_ops.rs`:
  - [ ] HagsManager struct
  - [ ] is_hags_supported() function
  - [ ] get_hags_state() function
  - [ ] set_hags_state() function (registry write)
- [ ] Implement vendor detection:
  - [ ] GpuVendor enum (Nvidia, Amd, Intel, Unknown)
  - [ ] GpuDetector struct
  - [ ] detect_vendor() function (dari WMI GPU name)
- [ ] Implement `nvidia_api.rs`:
  - [ ] NvidiaController struct
  - [ ] Initialize NVML library
  - [ ] set_power_mode() function (via nvidia-smi)
  - [ ] get_current_clocks() function
  - [ ] Graceful fallback jika NVML tidak ada
- [ ] Implement `amd_api.rs`:
  - [ ] AmdController struct
  - [ ] Load atiadlxx.dll via libloading
  - [ ] set_power_limit() function (via ADL FFI)
  - [ ] set_power_profile_via_tool() fallback (OverdriveNTool)
  - [ ] Drop trait untuk ADL cleanup
- [ ] Implement unified bridge:
  - [ ] GpuBridge struct
  - [ ] Route calls based on detected vendor
  - [ ] set_performance_mode() unified API
- [ ] Add Tauri commands (5 commands):
  - [ ] `get_hags_state`
  - [ ] `set_hags_state`
  - [ ] `get_gpu_vendor`
  - [ ] `set_gpu_performance_mode`
  - [ ] `get_nvidia_clocks`
- [ ] Write unit tests (18 tests)
- [ ] Write integration tests (7 tests)
- [ ] Manual validation (regedit, nvidia-smi, Radeon Software)

**Acceptance Criteria**:
- All 25 tests pass
- HAGS toggle writes registry (regedit confirms)
- GPU vendor detected correctly
- Power modes work untuk NVIDIA dan AMD

**Estimated Time**: 14 hours

---

### Task 3.2: Module 5 - XMost Smart Advisor
**Dependencies**: All modules (metrics aggregation)  
**Priority**: Medium

#### Subtasks:
- [ ] Create `src-tauri/src/modules/smart_advisor/mod.rs`
- [ ] Implement `metrics_collector.rs`:
  - [ ] SystemSnapshot struct (dengan all sub-structs)
  - [ ] HardwareMetrics, MemoryMetrics, CpuMetrics, GpuMetrics
  - [ ] UserContext struct
  - [ ] MetricsCollector::collect_snapshot() function
  - [ ] Aggregate dari all modules
- [ ] Implement `ai_client.rs`:
  - [ ] AiClient struct (dengan api_key, api_provider)
  - [ ] get_recommendations() method
  - [ ] call_gemini() method (Gemini API)
  - [ ] call_groq() method (Groq API fallback)
  - [ ] build_prompt() helper
  - [ ] HTTP client dengan reqwest
- [ ] Implement `recommendation_parser.rs`:
  - [ ] AdvisorResponse struct
  - [ ] Recommendation struct dengan Priority enum
  - [ ] parse() function (JSON extraction)
  - [ ] validate() function
  - [ ] Fallback parsing untuk markdown/plain text
- [ ] Add Tauri commands (2 commands):
  - [ ] `get_smart_recommendations`
  - [ ] `set_ai_config`
- [ ] Write unit tests (15 tests)
- [ ] Write integration tests (6 tests)
- [ ] Manual validation (dengan API key, review recommendations)

**Acceptance Criteria**:
- All 21 tests pass
- Snapshot collects dari all modules
- AI API returns structured recommendations
- Parser handles multiple response formats
- Response time < 10s

**Estimated Time**: 12 hours

---

## Phase 4: Cross-Module Integration (Week 4)

### Task 4.1: System Integration Tests
**Dependencies**: All modules  
**Priority**: High

#### Subtasks:
- [ ] Write `tests/integration_system.rs`
- [ ] Implement 10 cross-module tests:
  - [ ] All modules initialize successfully
  - [ ] Dashboard feeds data ke Advisor
  - [ ] Memory purge reflects dalam Dashboard
  - [ ] GPU detection consistent across modules
  - [ ] Power plan affects CPU metrics
  - [ ] Concurrent operations work
  - [ ] Error isolation (one module failure doesn't crash others)
  - [ ] Global state thread safety
  - [ ] App startup sequence
  - [ ] App shutdown cleanup
- [ ] Performance benchmarks:
  - [ ] Dashboard polling < 100ms
  - [ ] Memory purge < 500ms
  - [ ] Power plan switch < 200ms
  - [ ] Service toggle < 1000ms
  - [ ] GPU mode switch < 500ms
  - [ ] AI recommendation < 10s
- [ ] Memory leak tests (long-running stability)
- [ ] Stress tests (rapid command invocation)

**Acceptance Criteria**:
- All 10 integration tests pass
- All performance benchmarks meet targets
- No memory leaks detected (run 1 hour)
- No crashes under stress

**Estimated Time**: 12 hours

---

### Task 4.2: Main Entry Point & Global State
**Dependencies**: All modules  
**Priority**: Critical

#### Subtasks:
- [ ] Update `src-tauri/src/lib.rs`:
  - [ ] Export all modules
  - [ ] Define global statics (GPU_BRIDGE, AI_CLIENT)
  - [ ] Use once_cell::Lazy untuk lazy initialization
- [ ] Update `src-tauri/src/main.rs`:
  - [ ] Add privilege check on startup
  - [ ] Initialize logger (env_logger)
  - [ ] Register all Tauri commands (25+ commands)
  - [ ] Setup Tauri Builder
  - [ ] Error handling untuk startup failures
- [ ] Configure `tauri.conf.json`:
  - [ ] Set requestedExecutionLevel = "requireAdministrator"
  - [ ] Configure app name, version, identifier
  - [ ] Set window size, resizable, title
  - [ ] Configure allowlist (commands, shell, etc)
- [ ] Test end-to-end startup:
  - [ ] UAC prompt appears
  - [ ] App starts dengan admin privileges
  - [ ] All modules initialize
  - [ ] Tauri commands callable dari console

**Acceptance Criteria**:
- App starts successfully dengan UAC prompt
- All modules accessible
- Privilege check enforced
- No startup errors

**Estimated Time**: 6 hours

---

## Phase 5: Frontend Implementation (Week 5-6)

### Task 5.1: Frontend Foundation
**Dependencies**: Backend complete  
**Priority**: High

#### Subtasks:
- [ ] Setup React project structure dalam `src/`
- [ ] Configure Tailwind CSS
- [ ] Create shared hooks:
  - [ ] `useIPCCommand.js` (generic Tauri invoke wrapper)
  - [ ] `useSystemMonitor.js` (polling untuk Dashboard)
- [ ] Create shared components:
  - [ ] `PrivilegeStatus.jsx` (admin indicator)
  - [ ] `LoadingSpinner.jsx`
  - [ ] `ErrorModal.jsx`
  - [ ] `ConfirmDialog.jsx`
- [ ] Setup toast notifications (react-hot-toast atau similar)
- [ ] Create layout structure (sidebar, main content area)
- [ ] Implement routing (react-router-dom)

**Estimated Time**: 8 hours

---

### Task 5.2: Dashboard UI
**Dependencies**: Task 5.1  
**Priority**: High

#### Subtasks:
- [ ] Create `src/components/Dashboard.jsx`:
  - [ ] SystemInfoCard (CPU, GPU, Motherboard)
  - [ ] MemoryGauge (circular progress dengan used/total)
  - [ ] TemperatureChart (CPU & GPU temps)
  - [ ] Standby List indicator
- [ ] Integrate dengan `useSystemMonitor` hook
- [ ] Real-time data updates (1s polling)
- [ ] Error handling untuk failed queries
- [ ] Loading states
- [ ] Responsive design (Tailwind)

**Estimated Time**: 6 hours

---

### Task 5.3: Memory Control UI
**Dependencies**: Task 5.1  
**Priority**: High

#### Subtasks:
- [ ] Create `src/components/MemoryControl.jsx`:
  - [ ] Manual purge button dengan animation
  - [ ] Freed memory display
  - [ ] Auto-purge toggle switch
  - [ ] Threshold slider (MB input)
  - [ ] Timer resolution controls
  - [ ] Current resolution display
- [ ] Confirmation dialogs untuk purge
- [ ] Success/error toasts
- [ ] Loading states untuk async operations
- [ ] Responsive design

**Estimated Time**: 6 hours

---

### Task 5.4: CPU Tweaker UI
**Dependencies**: Task 5.1  
**Priority**: Medium

#### Subtasks:
- [ ] Create `src/components/CPUTweaker.jsx`:
  - [ ] Process selector (dropdown atau search)
  - [ ] Core affinity checkboxes (visual core grid)
  - [ ] Apply affinity button
  - [ ] Power plan radio buttons (Balanced, High Perf, Ultimate)
  - [ ] Active power plan indicator
- [ ] Create `src/components/ServiceToggle.jsx`:
  - [ ] Service cards (SysMain, wuauserv)
  - [ ] Status indicators (Running/Stopped)
  - [ ] Toggle buttons dengan confirmation
- [ ] Error handling untuk permission errors
- [ ] Responsive design

**Estimated Time**: 8 hours

---

### Task 5.5: GPU Control UI
**Dependencies**: Task 5.1  
**Priority**: Medium

#### Subtasks:
- [ ] Create `src/components/GPUControl.jsx`:
  - [ ] HAGS toggle switch
  - [ ] Reboot warning display
  - [ ] GPU vendor detection display
  - [ ] Power mode radio buttons (conditional based on vendor)
  - [ ] NVIDIA-specific controls
  - [ ] AMD-specific controls
  - [ ] Current clocks display (if available)
- [ ] Warning messages untuk power consumption
- [ ] Graceful degradation jika GPU tidak supported
- [ ] Responsive design

**Estimated Time**: 6 hours

---

### Task 5.6: Smart Advisor UI
**Dependencies**: Task 5.1  
**Priority**: Medium

#### Subtasks:
- [ ] Create `src/components/SmartAdvisor.jsx`:
  - [ ] Use case selector (gaming, productivity, streaming, mixed)
  - [ ] Target apps input (comma-separated)
  - [ ] Analyze button dengan loading state
  - [ ] Performance score card (circular gauge)
  - [ ] Recommendations list (cards dengan priority colors)
  - [ ] Category badges
  - [ ] Action instructions
- [ ] Create `src/components/Settings.jsx`:
  - [ ] API key input (masked)
  - [ ] API provider selector (Gemini, Groq)
  - [ ] Save configuration button
- [ ] Loading spinner untuk AI requests (5-10s)
- [ ] Error handling untuk API failures
- [ ] Responsive design

**Estimated Time**: 8 hours

---

### Task 5.7: Settings & Configuration
**Dependencies**: Task 5.1  
**Priority**: Low

#### Subtasks:
- [ ] Create `src/components/Settings.jsx`:
  - [ ] AI API configuration
  - [ ] Polling interval settings
  - [ ] Auto-purge default threshold
  - [ ] Theme toggle (dark/light mode)
  - [ ] About section (version, license)
- [ ] Persist settings via Tauri store plugin
- [ ] Validation untuk user inputs
- [ ] Reset to defaults button

**Estimated Time**: 4 hours

---

## Phase 6: Polish & Release (Week 7)

### Task 6.1: Error Handling & UX
**Dependencies**: All UI components  
**Priority**: High

#### Subtasks:
- [ ] Implement global error boundary
- [ ] Standardize error messages (user-friendly)
- [ ] Add loading indicators untuk all async operations
- [ ] Implement retry mechanisms untuk failed commands
- [ ] Add keyboard shortcuts untuk common actions
- [ ] Add tooltips untuk complex features
- [ ] Implement undo/revert mechanisms where applicable

**Estimated Time**: 6 hours

---

### Task 6.2: Testing & QA
**Dependencies**: Complete frontend  
**Priority**: Critical

#### Subtasks:
- [ ] Manual UI testing (all features)
- [ ] Cross-browser testing (Edge, Chrome)
- [ ] Accessibility testing (keyboard navigation, screen readers)
- [ ] Performance testing (UI responsiveness)
- [ ] Memory leak testing (frontend)
- [ ] Error scenario testing (no admin, no GPU, no internet)
- [ ] User acceptance testing (beta testers)

**Estimated Time**: 12 hours

---

### Task 6.3: Documentation
**Dependencies**: All tasks  
**Priority**: Medium

#### Subtasks:
- [ ] Write user manual (markdown or PDF)
- [ ] Create screenshots/GIFs untuk features
- [ ] Document API key setup (Gemini, Groq)
- [ ] Write troubleshooting guide
- [ ] Document system requirements clearly
- [ ] Create FAQ section
- [ ] Add inline help dalam UI (tooltips, help icons)
- [ ] Update README.md dengan installation instructions

**Estimated Time**: 8 hours

---

### Task 6.4: Build & Packaging
**Dependencies**: All tasks  
**Priority**: Critical

#### Subtasks:
- [ ] Configure release build optimizations (Cargo.toml)
- [ ] Setup code signing certificate (optional)
- [ ] Build Windows installer (.msi)
- [ ] Test installer pada clean Windows installation
- [ ] Create portable version (.exe only)
- [ ] Generate checksums untuk releases
- [ ] Test pada Windows 10 dan Windows 11
- [ ] Test pada different hardware configurations (Intel, AMD, NVIDIA, AMD GPU)

**Estimated Time**: 8 hours

---

### Task 6.5: Release Preparation
**Dependencies**: Task 6.4  
**Priority**: High

#### Subtasks:
- [ ] Create GitHub release (tag, changelog)
- [ ] Upload installers dan binaries
- [ ] Write release notes (features, known issues)
- [ ] Create announcement post (if applicable)
- [ ] Setup issue templates pada GitHub
- [ ] Configure CI/CD pipeline (optional untuk future releases)
- [ ] Plan versioning strategy (SemVer)

**Estimated Time**: 4 hours

---

## Summary

### Total Estimated Time: ~200 hours (5 weeks full-time)

### Critical Path:
1. Phase 0: Setup (4h)
2. Phase 1: Foundation (24h)
3. Phase 2: Core Features (28h)
4. Phase 3: Advanced Features (26h)
5. Phase 4: Integration (18h)
6. Phase 5: Frontend (46h)
7. Phase 6: Polish & Release (38h)

### Milestones:
- **Week 1**: Foundation complete (Utils + Windows Tweaker)
- **Week 2**: Core features complete (Dashboard + Memory)
- **Week 3**: All backend modules complete
- **Week 4**: Integration tests pass, backend validated
- **Week 5-6**: Frontend complete, end-to-end testing
- **Week 7**: Release v0.1.0

### Risk Factors:
- NTAPI undocumented behavior (mitigation: extensive testing)
- GPU vendor API availability (mitigation: fallback mechanisms)
- AI API rate limits (mitigation: caching, fallback provider)
- Windows version compatibility (mitigation: version detection)

---

## Task Status Legend
- [ ] Not Started
- [🚧] In Progress
- [✅] Complete
- [❌] Blocked
- [⚠️] Needs Review

**Last Updated**: 2026-07-19
