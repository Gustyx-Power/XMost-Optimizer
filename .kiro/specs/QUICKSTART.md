# XMOST-OPTIMIZER Quick Start Guide

## 🚀 Untuk Developer

Panduan cepat untuk memulai development XMOST-OPTIMIZER.

---

## 📋 Prerequisites Checklist

Sebelum mulai, pastikan semua ini sudah terinstall:

- [ ] **Windows 10 (1909+) atau Windows 11**
- [ ] **Administrator Account** (UAC enabled)
- [ ] **Rust 1.70+**
  ```bash
  rustc --version
  # Should output: rustc 1.70.0 or higher
  ```
- [ ] **Node.js 16+**
  ```bash
  node --version
  # Should output: v16.0.0 or higher
  ```
- [ ] **Visual Studio Build Tools 2019+**
  - Download: https://visualstudio.microsoft.com/downloads/
  - Install "Desktop development with C++" workload
- [ ] **Git**
  ```bash
  git --version
  ```

---

## 🛠️ Environment Setup (15 minutes)

### Step 1: Install Tauri CLI
```bash
cargo install tauri-cli
```

### Step 2: Verify Installation
```bash
cargo tauri --version
# Should output: tauri-cli 1.5.x
```

### Step 3: Clone Repository
```bash
git clone https://github.com/yourusername/XMost-Optimizer.git
cd XMost-Optimizer
```

---

## 📁 Project Structure Overview

Sebelum coding, familiarize dengan struktur:

```
XMost-Optimizer/
├── .kiro/specs/           # 📄 READ THIS FIRST - All specifications
│   ├── xmost-optimizer-main.md
│   ├── module-1-dashboard.md
│   ├── module-2-memory-orchestrator.md
│   ├── module-3-windows-tweaker.md
│   ├── module-4-gpu-bridge.md
│   ├── module-5-smart-advisor.md
│   ├── test-plan-master.md
│   ├── tasks.md
│   └── architecture-diagram.md
├── .kiro/steering/        # 📚 Best practices & patterns
│   ├── privilege-elevation.md
│   ├── ntapi-error-handling.md
│   └── rust-modular-structure.md
├── src-tauri/            # 🦀 Rust backend (TO BE IMPLEMENTED)
└── src/                  # ⚛️ React frontend (TO BE IMPLEMENTED)
```

---

## 📖 Documentation Reading Order

**PENTING**: Baca dalam urutan ini sebelum coding!

### 1️⃣ Architecture & Overview (30 minutes)
```
1. README.md                              # Project overview
2. .kiro/specs/xmost-optimizer-main.md    # Architecture overview
3. .kiro/specs/architecture-diagram.md    # Visual diagrams
```

### 2️⃣ Steering Files (Best Practices) (45 minutes)
```
4. .kiro/steering/privilege-elevation.md     # Admin patterns
5. .kiro/steering/ntapi-error-handling.md    # NTAPI safety
6. .kiro/steering/rust-modular-structure.md  # Code organization
```

### 3️⃣ Module Specifications (2 hours)
**Read in dependency order:**
```
7. .kiro/specs/module-3-windows-tweaker.md   # Foundation module
8. .kiro/specs/module-1-dashboard.md         # System monitoring
9. .kiro/specs/module-2-memory-orchestrator.md # Memory management
10. .kiro/specs/module-4-gpu-bridge.md       # GPU control
11. .kiro/specs/module-5-smart-advisor.md    # AI recommendations
```

### 4️⃣ Implementation Plan (1 hour)
```
12. .kiro/specs/tasks.md              # Task breakdown
13. .kiro/specs/test-plan-master.md   # Test validation
```

**Total Reading Time**: ~4-5 hours (WORTH IT! 🎯)

---

## 🏁 Implementation Flow

### Phase 1: Setup Project Skeleton (Week 1 - Day 1)

1. **Initialize Tauri Project**
   ```bash
   # This will create src-tauri/ structure
   npm create tauri-app
   # Choose:
   # - Framework: React
   # - TypeScript: No (or Yes if preferred)
   # - Package manager: npm
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

3. **Configure tauri.conf.json**
   ```json
   {
     "tauri": {
       "bundle": {
         "windows": {
           "requestedExecutionLevel": "requireAdministrator"
         }
       }
     }
   }
   ```

4. **Setup Project Structure**
   ```bash
   cd src-tauri/src
   mkdir modules utils types
   ```

### Phase 2: Build Foundation (Week 1 - Day 2-3)

Follow **tasks.md** strictly:

1. **Task 1.1**: Implement Utils & Types layer
   - Create error types
   - Implement privilege check
   - Setup NTAPI wrappers
   - **RUN TESTS**: `cargo test`

2. **Task 1.2**: Implement Windows Tweaker module
   - CPU affinity management
   - Power plan switching
   - Service control
   - **RUN TESTS**: `cargo test --lib modules::windows_tweaker`

### Phase 3: Core Features (Week 2)

Continue following **tasks.md**:

3. **Task 2.1**: Dashboard Monitor
4. **Task 2.2**: Memory Orchestrator

### Phase 4: Advanced Features (Week 3)

5. **Task 3.1**: GPU Bridge
6. **Task 3.2**: Smart Advisor

### Phase 5: Integration (Week 4)

7. **Task 4.1**: Cross-module tests
8. **Task 4.2**: Main entry point

### Phase 6: Frontend (Week 5-6)

9. **Task 5.1-5.7**: React UI implementation

### Phase 7: Polish (Week 7)

10. **Task 6.1-6.5**: Testing, docs, release

---

## 🧪 Testing Workflow

### Every Module MUST Pass These Before Moving On:

1. **Unit Tests**
   ```bash
   cargo test --lib modules::<module_name>
   ```

2. **Integration Tests**
   ```bash
   cargo test --test integration_<module_name> -- --ignored
   ```

3. **Manual Validation**
   ```bash
   # Run as Administrator!
   cargo tauri dev
   ```
   - Open browser console (F12)
   - Invoke commands manually
   - Verify dengan external tools (Task Manager, RAMMap, etc.)

4. **Sign-Off**
   - [ ] All tests pass ✅
   - [ ] Manual validation complete ✅
   - [ ] Document any issues ✅

**DO NOT proceed to next module jika tests fail!**

---

## 🔧 Development Commands

### Backend Development
```bash
# Run tests (unit only)
cargo test

# Run tests dengan output
cargo test -- --nocapture

# Run specific module tests
cargo test --lib modules::dashboard

# Run integration tests (requires admin)
cargo test --test integration_tests -- --ignored

# Build backend only
cd src-tauri
cargo build

# Run clippy (linter)
cargo clippy

# Format code
cargo fmt
```

### Frontend Development
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build frontend
npm run build

# Lint
npm run lint
```

### Full App Development
```bash
# Run app in dev mode (hot reload)
cargo tauri dev

# Build release
cargo tauri build --release

# Build debug
cargo tauri build
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Permission Denied" Errors
**Symptom**: NTAPI calls fail dengan status 0xC0000022  
**Solution**: Run sebagai Administrator
```bash
# Right-click terminal -> Run as Administrator
cargo tauri dev
```

### Issue 2: "NVML Not Found"
**Symptom**: NVIDIA tests fail  
**Solution**: Install NVIDIA drivers atau skip GPU tests jika tidak ada GPU
```bash
cargo test --lib modules::gpu_bridge -- --skip nvidia
```

### Issue 3: "WMI Query Timeout"
**Symptom**: Dashboard tests hang  
**Solution**: Check Windows Management service
```bash
# Run in Admin CMD
net start winmgmt
```

### Issue 4: Build Failures (Missing Dependencies)
**Symptom**: Linker errors  
**Solution**: Install Visual Studio Build Tools dengan C++ workload

### Issue 5: Tauri App Won't Start
**Symptom**: "WebView2 not found"  
**Solution**: Install WebView2 runtime
- Download: https://developer.microsoft.com/microsoft-edge/webview2/

---

## 📊 Progress Tracking

Use **tasks.md** sebagai checklist:

```markdown
### Module 1: Dashboard
- [x] Task 1.1: Utils & Types
- [x] Task 1.2: Windows Tweaker
- [🚧] Task 2.1: Dashboard Monitor  <-- Current task
- [ ] Task 2.2: Memory Orchestrator
...
```

Symbols:
- `[ ]` Not Started
- `[🚧]` In Progress
- `[✅]` Complete
- `[❌]` Blocked
- `[⚠️]` Needs Review

---

## 🎯 Daily Development Routine

### Morning (2 hours)
1. Review spec for current module (30 min)
2. Write implementation (90 min)

### Afternoon (3 hours)
1. Write unit tests (60 min)
2. Fix failures (60 min)
3. Manual validation (60 min)

### Before Commit
```bash
# Always run before committing!
cargo fmt
cargo clippy
cargo test
```

---

## 📚 External Tools Needed

For manual validation, download these:

1. **Sysinternals Suite**
   - RAMMap (memory validation)
   - ClockRes (timer resolution validation)
   - Process Explorer (process monitoring)
   - Download: https://docs.microsoft.com/sysinternals/

2. **Hardware Monitoring**
   - CPU-Z (CPU info validation)
   - GPU-Z (GPU info validation)
   - HWiNFO (temperature validation)

3. **GPU Tools**
   - MSI Afterburner (NVIDIA)
   - Radeon Software (AMD)

---

## 🔐 API Keys Setup (For Module 5)

### Gemini API
1. Go to: https://makersuite.google.com/app/apikey
2. Create new API key
3. Save to environment variable:
   ```bash
   setx GEMINI_API_KEY "your-key-here"
   ```

### Groq API (Fallback)
1. Go to: https://console.groq.com
2. Create new API key
3. Save to environment variable:
   ```bash
   setx GROQ_API_KEY "your-key-here"
   ```

---

## 💡 Pro Tips

1. **Read Steering Files First**  
   The patterns dalam steering files akan save you hours of debugging!

2. **Follow Dependency Order**  
   Build modules dalam order: Utils -> WindowsTweaker -> Dashboard -> Memory -> GPU -> Advisor

3. **Test Early, Test Often**  
   Jangan accumulate technical debt. Fix tests before moving on.

4. **Use Reference Tools**  
   Always verify behavior dengan external tools (Task Manager, RAMMap, etc.)

5. **Document Issues**  
   Jika encounter NTAPI weirdness, document it! Undocumented API = painful debugging.

6. **Commit Often**  
   Small commits > big commits. Easier to revert jika something breaks.

7. **Ask for Review**  
   Before proceeding to next phase, get code review (if team project).

---

## 🆘 Getting Help

Jika stuck:

1. **Check Specs First**  
   90% of questions answered dalam spec files.

2. **Review Steering Files**  
   Error handling patterns, privilege issues covered here.

3. **Search Test Plan**  
   Common issues documented dalam test-plan-master.md.

4. **Debug Systematically**  
   - Check privilege (admin?)
   - Check Windows version (10+?)
   - Check error codes (NTSTATUS?)
   - Check external tools (RAMMap, etc.)

5. **File an Issue**  
   If truly stuck, document:
   - Module name
   - Error message
   - Steps to reproduce
   - System info (Windows version, CPU, GPU)

---

## 🎉 Success Criteria

You're ready to proceed when:

- [ ] All spec files read and understood
- [ ] Development environment setup complete
- [ ] First module (Utils) implemented and tested
- [ ] Comfortable dengan Rust + Tauri workflow
- [ ] External tools downloaded and tested
- [ ] Tests run successfully (even if skipped for missing hardware)

---

## 📞 Contact & Resources

- **GitHub**: (coming soon)
- **Discord**: (coming soon)
- **Documentation**: All files in `.kiro/specs/` and `.kiro/steering/`

---

**Good Luck! 🚀**

Remember: **Slow is smooth, smooth is fast.** Take time to read specs thoroughly. It will save you debugging time later.

**Last Updated**: 2026-07-19
