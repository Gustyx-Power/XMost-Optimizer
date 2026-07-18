# XMOST-OPTIMIZER - Windows Desktop Optimization Tool

## Overview
Aplikasi Windows desktop untuk optimasi sistem real-time menggunakan Rust (backend/core) + Tauri (UI framework) + React/Tailwind (frontend).

## Tech Stack
- **Backend**: Rust (core logic, system API calls)
- **UI Framework**: Tauri v1.x
- **Frontend**: React 18+ dengan Tailwind CSS
- **IPC**: Tauri Command API
- **System API**: WMI, NTAPI (undocumented), Win32 API

## Privilege Requirements
**CRITICAL**: Seluruh aplikasi HARUS berjalan dengan Administrator privileges untuk:
- NTAPI system memory operations
- Service management (start/stop)
- Registry write operations (HKLM)
- Power plan modifications
- Process affinity assignment

## Architecture Overview

### Module Dependency Graph
```
┌─────────────────────────────────────────────────┐
│          Tauri App (Admin Elevation)            │
└─────────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐  ┌──────────┐  ┌─────────────┐
│  Dashboard   │  │  Memory  │  │ GPU Control │
│   Monitor    │  │Orchestr. │  │   Bridge    │
└──────────────┘  └──────────┘  └─────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       ▼
            ┌─────────────────────┐
            │  Windows Core &     │
            │   CPU Tweaker       │
            └─────────────────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │  XMost Smart        │
            │    Advisor          │
            └─────────────────────┘
```

### Module Dependencies (Build Order)
1. **Windows Core & CPU Tweaker** (Foundation - no dependencies)
2. **Memory Orchestrator** (Depends on: Windows Core)
3. **Dashboard & System Monitor** (Depends on: Memory Orchestrator, Windows Core)
4. **GPU Control Bridge** (Depends on: Windows Core)
5. **XMost Smart Advisor** (Depends on: All modules for metrics)

## Project Structure
```
XMost-Optimizer/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs                    # Tauri entry point, privilege check
│   │   ├── lib.rs                     # Module exports
│   │   ├── modules/
│   │   │   ├── mod.rs                 # Module registry
│   │   │   ├── dashboard/             # Module 1
│   │   │   │   ├── mod.rs
│   │   │   │   ├── wmi_provider.rs
│   │   │   │   ├── system_info.rs
│   │   │   │   └── realtime_monitor.rs
│   │   │   ├── memory_orchestrator/   # Module 2
│   │   │   │   ├── mod.rs
│   │   │   │   ├── ntapi_wrapper.rs
│   │   │   │   ├── purge_engine.rs
│   │   │   │   └── timer_resolution.rs
│   │   │   ├── windows_tweaker/       # Module 3
│   │   │   │   ├── mod.rs
│   │   │   │   ├── cpu_affinity.rs
│   │   │   │   ├── power_plan.rs
│   │   │   │   └── service_manager.rs
│   │   │   ├── gpu_bridge/            # Module 4
│   │   │   │   ├── mod.rs
│   │   │   │   ├── registry_ops.rs
│   │   │   │   ├── nvidia_api.rs
│   │   │   │   └── amd_api.rs
│   │   │   └── smart_advisor/         # Module 5
│   │   │       ├── mod.rs
│   │   │       ├── metrics_collector.rs
│   │   │       ├── ai_client.rs
│   │   │       └── recommendation_parser.rs
│   │   ├── utils/
│   │   │   ├── mod.rs
│   │   │   ├── privilege_check.rs
│   │   │   ├── error_handler.rs
│   │   │   └── ipc_bridge.rs
│   │   └── types/
│   │       ├── mod.rs
│   │       ├── system_info.rs
│   │       └── errors.rs
│   ├── Cargo.toml
│   └── tauri.conf.json               # Manifest dengan requestedExecutionLevel
├── src/                               # React frontend
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── MemoryControl.jsx
│   │   ├── CPUTweaker.jsx
│   │   ├── GPUControl.jsx
│   │   └── SmartAdvisor.jsx
│   ├── hooks/
│   │   ├── useSystemMonitor.js
│   │   └── useIPCCommand.js
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── README.md
```
