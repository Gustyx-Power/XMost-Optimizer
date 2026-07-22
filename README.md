# XMost Optimizer

XMost Optimizer is a modern, lightweight, and aggressive Windows system optimization utility. Built with **Tauri v2** (Rust) and **Svelte 5** (TypeScript), it features a highly polished, interactive UI with dark/light mode support, real-time hardware telemetry, and advanced OS tweaks.

## Key Features

### Hardware Monitor & Telemetry
- **Real-Time Usage**: Live graphs (Sparklines) monitoring CPU usage and RAM availability with MD3-styled thick progress bars.
- **Detailed Specs**: CPU-Z style hardware detection for CPU, Motherboard, BIOS, RAM, and GPUs.
- **Dynamic GPU Carousel**: Supports multiple graphics cards (e.g., Integrated + Discrete) with a smooth Javascript-driven swipe/scroll carousel.

### Intelligent Memory Purge
- **Manual Purge**: Clear the Windows Standby List on-demand to instantly free up cached memory.
- **Auto-Purge**: Set automated threshold rules (e.g., *Purge when Standby List > 1 GB AND Free Memory < 500 MB*) to keep the system responsive during heavy workloads.
- **Timer Resolution**: Displays the current system Timer Resolution (NT timer).

### OS Tweaker Core
- **Ultimate Performance Plan**: Unlocks and activates the hidden Windows "Ultimate Performance" power schema to prevent aggressive CPU downclocking.
- **Disable Core Parking**: Forces all CPU cores to stay un-parked and active, drastically reducing micro-stutters in games.
- **HAGS Toggle**: Quickly Enable/Disable Hardware-Accelerated GPU Scheduling (HAGS) via the registry to reduce latency and let the GPU manage its own memory.
- **Safe Temp Cleaner**: A highly aggressive but safe recursive algorithm to clean the Windows `%temp%` folder. Safely ignores files locked by running apps, complete with an elegant, real-time progress modal animation.

### Seamless Integration
- **Run on Startup**: Integrated with `tauri-plugin-autostart` to optionally launch silently with Windows.
- **Bilingual Support**: Full i18n support for Indonesian (ID) and English (EN).
- **Adaptive UI**: Beautiful glassmorphism UI with semantic colors that seamlessly adapts to Light Mode and Dark Mode.

## Getting Started

Ensure you have **Node.js** and **Rust** installed on your system.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development
Run the app in dev mode. 
*Note: Run your terminal as **Administrator** because OS tweaks (Powercfg, Registry, memory purging) require elevation!*
```bash
npx tauri dev
```

### 3. Build for Production
```bash
npx tauri build
```

## Architecture
- **Frontend**: Svelte 5, TailwindCSS, shadcn-svelte components.
- **Backend**: Rust, Tauri v2, `winapi` / `windows` crates, WMI for hardware detection.
