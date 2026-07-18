# XMOST-OPTIMIZER Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           XMOST-OPTIMIZER                                │
│                    Windows Desktop Application                           │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    React Frontend (WebView2)                     │   │
│  │                                                                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│  │  │Dashboard │  │ Memory   │  │   CPU    │  │   GPU    │       │   │
│  │  │   UI     │  │ Control  │  │ Tweaker  │  │ Control  │       │   │
│  │  │          │  │    UI    │  │    UI    │  │    UI    │       │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │   │
│  │        │              │              │              │            │   │
│  │        └──────────────┴──────────────┴──────────────┘            │   │
│  │                           │                                       │   │
│  │                    ┌──────▼───────┐                              │   │
│  │                    │ Smart Advisor│                              │   │
│  │                    │      UI      │                              │   │
│  │                    └──────────────┘                              │   │
│  └───────────────────────────┬───────────────────────────────────────┘ │
│                               │ Tauri IPC Bridge                        │
│  ┌────────────────────────────▼────────────────────────────────────┐   │
│  │                    Rust Backend (Tauri)                          │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │                    Module Registry                        │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │         │              │              │              │           │   │
│  │  ┌──────▼─────┐ ┌─────▼──────┐ ┌─────▼──────┐ ┌────▼─────┐   │   │
│  │  │ Dashboard  │ │   Memory   │ │  Windows   │ │   GPU    │   │   │
│  │  │  Monitor   │ │Orchestrator│ │  Tweaker   │ │  Bridge  │   │   │
│  │  │            │ │            │ │            │ │          │   │   │
│  │  │ WMI Query  │ │ NTAPI Purge│ │CPU Affinity│ │HAGS Reg  │   │   │
│  │  │ Temp Sense │ │Auto-Purge  │ │Power Plan  │ │NVIDIA API│   │   │
│  │  │ Mem Stats  │ │Timer Res   │ │Service Mgr │ │AMD API   │   │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └──────────┘   │   │
│  │         │              │              │              │           │   │
│  │         └──────────────┴──────────────┴──────────────┘           │   │
│  │                           │                                       │   │
│  │                    ┌──────▼───────────┐                          │   │
│  │                    │  Smart Advisor   │                          │   │
│  │                    │                  │                          │   │
│  │                    │ Metrics Collector│                          │   │
│  │                    │   AI Client      │                          │   │
│  │                    │ Recommendation   │                          │   │
│  │                    │     Parser       │                          │   │
│  │                    └──────────────────┘                          │   │
│  │                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐ │   │
│  │  │                  Shared Utilities                           │ │   │
│  │  │                                                              │ │   │
│  │  │  Privilege Check │ Error Handler │ NTAPI Wrapper │ Retry   │ │   │
│  │  └────────────────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────────────────┘ │
│                               │                                         │
│  ┌────────────────────────────▼────────────────────────────────────┐  │
│  │                    Windows System APIs                           │  │
│  │                                                                   │  │
│  │   WMI   │  NTAPI  │  Win32 API  │  Registry  │  Services       │  │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼──────┐      ┌─────▼──────┐      ┌─────▼──────┐
    │   Gemini   │      │    Groq    │      │   GPU SDKs │
    │    API     │      │    API     │      │ NVML / ADL │
    └────────────┘      └────────────┘      └────────────┘
```

---

## Data Flow Diagram

### Dashboard Monitoring Flow
```
┌──────────────┐
│  React UI    │
│  Dashboard   │
└──────┬───────┘
       │ invoke('get_memory_stats') - 1s interval
       ▼
┌──────────────────┐
│ Tauri IPC Bridge │
└──────┬───────────┘
       │
       ▼
┌─────────────────────┐
│ Dashboard Module    │
│ realtime_monitor.rs │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  WMI Query Layer    │
│ Win32_PerfOS_Memory │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Windows WMI        │
│  Provider Service   │
└──────┬──────────────┘
       │
       ▼ Return: MemoryStats { total, used, standby, ... }
┌──────────────┐
│  React UI    │
│  Update State│
└──────────────┘
```

### Memory Purge Flow
```
┌──────────────┐
│  React UI    │
│ Memory Button│
└──────┬───────┘
       │ User clicks "Purge Now"
       ▼
       invoke('purge_memory_manual')
       │
       ▼
┌──────────────────┐
│ Tauri IPC Bridge │
└──────┬───────────┘
       │
       ▼
┌─────────────────────────┐
│ Memory Orchestrator     │
│ ntapi_wrapper.rs        │
└──────┬──────────────────┘
       │
       ▼ Check admin privileges
┌─────────────────────────┐
│ Privilege Check Util    │
└──────┬──────────────────┘
       │ ✓ Elevated
       ▼
┌─────────────────────────┐
│ Get standby size before │
│ Dashboard.get_memory()  │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Call NTAPI              │
│ NtSetSystemInformation  │
│ SYSTEM_MEMORY_LIST = 80 │
│ MEMORY_PURGE = 4        │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ ntdll.dll (Kernel)      │
│ Purge standby pages     │
└──────┬──────────────────┘
       │
       ▼ Calculate freed MB
┌─────────────────────────┐
│ Return freed_mb: u64    │
└──────┬──────────────────┘
       │
       ▼
┌──────────────┐
│  React UI    │
│ Show toast:  │
│ "Freed 2GB"  │
└──────────────┘
```

### AI Recommendation Flow
```
┌──────────────┐
│  React UI    │
│Smart Advisor │
└──────┬───────┘
       │ User clicks "Analyze System"
       ▼
       invoke('get_smart_recommendations', { useCase, targetApps })
       │
       ▼
┌──────────────────┐
│ Tauri IPC Bridge │
└──────┬───────────┘
       │
       ▼
┌─────────────────────────────┐
│ Smart Advisor Module        │
│ metrics_collector.rs        │
└──────┬──────────────────────┘
       │
       ▼ Collect metrics dari all modules
┌─────────────────────────────┐
│ Dashboard.get_hardware_info │
│ Dashboard.get_memory_stats  │
│ Dashboard.get_temperatures  │
│ WindowsTweaker.get_power    │
│ GpuBridge.get_vendor        │
│ GpuBridge.get_hags          │
└──────┬──────────────────────┘
       │
       ▼ Build SystemSnapshot JSON
┌─────────────────────────────┐
│ Smart Advisor Module        │
│ ai_client.rs                │
└──────┬──────────────────────┘
       │
       ▼ HTTP POST request
┌─────────────────────────────┐
│ Gemini API                  │
│ generativelanguage.google   │
│ POST /v1beta/models/...     │
└──────┬──────────────────────┘
       │
       ▼ JSON response
┌─────────────────────────────┐
│ recommendation_parser.rs    │
│ Parse JSON -> AdvisorResp   │
└──────┬──────────────────────┘
       │
       ▼ Return AdvisorResponse
┌──────────────┐
│  React UI    │
│ Render cards │
│ - Summary    │
│ - Score: 85  │
│ - 3 Recs     │
└──────────────┘
```

---

## Module Dependency Graph

### Build Order (Sequential)
```
1. Utils & Types (Foundation)
   ↓
2. Windows Tweaker (Independent module)
   ↓
3. Dashboard Monitor (Uses Utils)
   ↓
4. Memory Orchestrator (Uses Utils + Dashboard)
   ↓
5. GPU Bridge (Uses Utils + Dashboard)
   ↓
6. Smart Advisor (Uses ALL modules)
```

### Dependency Matrix
```
                Utils  Dashboard  MemoryOrch  WindowsTweak  GPUBridge  SmartAdv
Utils             -       -           -            -           -          -
Dashboard         ✓       -           -            -           -          -
MemoryOrch        ✓       ✓           -            -           -          -
WindowsTweak      ✓       -           -            -           -          -
GPUBridge         ✓       ✓           -            -           -          -
SmartAdv          ✓       ✓           ✓            ✓           ✓          -

Legend:
✓ = Depends on
- = No dependency
```

---

## Communication Patterns

### Pattern 1: Direct Function Calls (Intra-Backend)
```rust
// Smart Advisor calls Dashboard directly
use crate::modules::dashboard;

let hw_info = dashboard::get_hardware_info()?;
let mem_stats = dashboard::get_memory_stats()?;
```

### Pattern 2: Global Shared State
```rust
// Multiple modules access GPU bridge via global static
use crate::GPU_BRIDGE;

let bridge = GPU_BRIDGE.lock().unwrap();
let vendor = bridge.get_vendor();
```

### Pattern 3: Tauri Commands (Frontend-Backend)
```javascript
// Frontend invokes Rust backend via Tauri
import { invoke } from '@tauri-apps/api/tauri';

const result = await invoke('purge_memory_manual');
```

---

## Error Handling Flow

### Error Propagation Path
```
┌──────────────────┐
│  Windows API     │
│  Returns error   │
└────────┬─────────┘
         │
         ▼ NTSTATUS code (e.g., 0xC0000022)
┌──────────────────┐
│  NTAPI Wrapper   │
│  Convert status  │
└────────┬─────────┘
         │
         ▼ NtApiError enum
┌──────────────────┐
│  Module Logic    │
│  Handle error    │
└────────┬─────────┘
         │
         ▼ Result<T, String>
┌──────────────────┐
│  Tauri Command   │
│  Return Err(msg) │
└────────┬─────────┘
         │
         ▼ JavaScript Error object
┌──────────────────┐
│  React UI        │
│  Show toast      │
└──────────────────┘
```

### Error Categories
1. **Permission Errors**: Admin not elevated
2. **System Errors**: NTAPI failure, WMI timeout
3. **API Errors**: AI service unavailable
4. **Validation Errors**: Invalid user input
5. **Not Supported**: Feature unavailable pada OS version

---

## Privilege Elevation Architecture

```
┌─────────────────────────────────────────────────────┐
│              App Launch (User clicks)                │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│           Windows UAC Prompt                         │
│  "Do you want to allow this app to make changes?"   │
└─────────────────────┬───────────────────────────────┘
                      │ User clicks "Yes"
                      ▼
┌─────────────────────────────────────────────────────┐
│      Process starts with Admin Token                │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│         main.rs - Entry Point                        │
│  PrivilegeChecker::require_elevation_or_exit()      │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼ Query token elevation status
┌─────────────────────────────────────────────────────┐
│         OpenProcessToken + GetTokenInformation      │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │ Elevated?                  │
        ▼ YES                        ▼ NO
┌───────────────┐          ┌─────────────────┐
│ Continue      │          │ Exit with error │
│ Initialize    │          │ "Run as Admin"  │
└───────┬───────┘          └─────────────────┘
        │
        ▼
┌───────────────────────────────────┐
│  All modules can access:          │
│  - NTAPI functions                │
│  - HKLM registry writes           │
│  - Service control                │
│  - Process manipulation           │
└───────────────────────────────────┘
```

---

## Testing Architecture

### Test Layers
```
┌─────────────────────────────────────────────────────┐
│              Manual Validation Tests                 │
│  (Human verification dengan external tools)         │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│           Integration Tests                          │
│  (Cross-module, IPC, end-to-end workflows)          │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              Unit Tests                              │
│  (Per-module functions, error handling)             │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│           Implementation Code                        │
│  (Rust modules, React components)                   │
└─────────────────────────────────────────────────────┘
```

### Test Coverage Target
- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All critical paths
- **Manual Tests**: All user-facing features

---

## Deployment Architecture

### Development Build
```
Developer Machine (Windows)
├── cargo tauri dev
├── Hot reload enabled
├── Debug symbols included
└── Console logging active
```

### Production Build
```
Build Server (Windows)
├── cargo tauri build --release
├── Optimizations: LTO, strip symbols
├── Code signing (optional)
├── Output: .msi installer + portable .exe
└── Distribution via GitHub Releases
```

---

## Security Boundaries

```
┌───────────────────────────────────────────────────┐
│          Trusted Execution Environment            │
│  (App running with Admin privileges)              │
│                                                    │
│  ┌──────────────────────────────────────────┐   │
│  │     Rust Backend (Tauri)                  │   │
│  │  - Direct system API access               │   │
│  │  - NTAPI calls                            │   │
│  │  - Registry writes                        │   │
│  └──────────────────────────────────────────┘   │
│                     ▲                              │
│                     │ Tauri IPC (Validated)       │
│                     │                              │
│  ┌──────────────────▼──────────────────────┐    │
│  │     Frontend (WebView2 Sandbox)          │    │
│  │  - User input                             │    │
│  │  - UI rendering                           │    │
│  │  - NO direct system access                │    │
│  └──────────────────────────────────────────┘    │
└───────────────────────────────────────────────────┘
                     │
                     │ HTTPS (AI APIs)
                     ▼
       ┌─────────────────────────┐
       │   External Services     │
       │  - Gemini API           │
       │  - Groq API             │
       └─────────────────────────┘
```

### Security Measures
1. **Input Validation**: All Tauri commands validate inputs
2. **Whitelist Approach**: Service manager only allows specific services
3. **No Arbitrary Execution**: No user-provided code execution
4. **API Key Encryption**: Secure storage via Tauri store
5. **Audit Logging**: All privileged operations logged

---

**Architecture Version**: 1.0  
**Last Updated**: 2026-07-19  
**Status**: ✅ Complete - Ready for Implementation
