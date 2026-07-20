const translations: Record<string, any> = {
  en: {
    nav: {
      monitor: "Monitor",
      memory: "Memory",
      tweaker: "Tweaker",
      settings: "Settings",
    },
    common: {
      unknown: "Unknown",
      total: "Total",
      used: "Used",
      available: "Available",
      status: "Status",
      enabled: "Enabled",
      disabled: "Disabled",
      save: "Save",
      success: "Success",
      error: "Error",
      warning: "Warning",
      info: "Information",
      close: "Close",
    },
    settings: {
      title: "Settings",
      subtitle: "Customize application language, theme and behavior.",
      language: {
        title: "Language / Bahasa",
        description: "Choose your preferred user interface language.",
        select: "Select Language",
      },
      theme: {
        title: "Application Theme",
        description: "Toggle between light and dark mode colors.",
        dark: "Dark Mode",
        light: "Light Mode",
      },
      about: {
        title: "About XMost Optimizer",
        version: "Version",
        build: "Target OS: Windows 10/11",
        description: "A professional system optimization utility built using Tauri and SvelteKit.",
      }
    },
    monitor: {
      title: "System Telemetry",
      subtitle: "Real-time hardware specification and usage monitor",
      os: {
        title: "Operating System",
        subtitle: "Active Windows edition & build",
      },
      cpu: {
        title: "Processor Spec",
        subtitle: "CPU Core & frequency details",
        name: "Name",
        codename: "Codename",
        technology: "Technology",
        speed: "Base Clock",
        cores: "Cores/Threads",
      },
      gpu: {
        title: "Graphics Controller",
        subtitle: "GPU Adapter & driver details",
        name: "Name",
        codename: "Codename",
        technology: "Technology",
        vram: "VRAM Size",
        driver: "Driver Version",
      },
      ram: {
        title: "Memory Profile",
        subtitle: "Dynamic SPD telemetry",
        brand: "Brand",
        type: "Type",
        speed: "Speed",
        layout: "Layout",
      },
      mobo: {
        title: "Motherboard",
        subtitle: "Baseboard Platform",
      },
      bios: {
        title: "BIOS Firmware",
        subtitle: "SMBIOS Motherboard BIOS",
        brand: "Brand",
        version: "Version",
        date: "Date",
      },
      usage: {
        cpu_load: "CPU Total Load",
        ram_load: "RAM Memory Usage",
        ram_in_use: "In Use",
        ram_total: "Total Capacity",
      }
    },
    memory: {
      title: "Memory Orchestrator",
      subtitle: "Optimize system memory footprint and standby lists in real-time.",
      standby: {
        title: "Standby Memory",
        desc: "Contains cached files and data not actively used but kept in RAM.",
      },
      free: {
        title: "Free Memory",
        desc: "RAM that contains zeroed pages and is immediately assignable.",
      },
      avail: {
        title: "Available Memory",
        desc: "Total memory ready for use, including standby cache lists.",
      },
      total: {
        title: "Total Capacity",
        desc: "Physical RAM capacity reported by the motherboard BIOS.",
      },
      pagefile: {
        title: "Windows Pagefile Metrics",
        desc: "Shows active page file storage usage on secondary system drives.",
        used: "Used",
        total: "Total Pagefile Size",
        usage: "Usage Percentage",
      },
      timer: {
        title: "High Precision Timer Resolution",
        desc: "Active kernel interrupt timer resolution. Lower values reduce gaming latency.",
        current: "Current Resolution",
        target: "Target Resolution",
        set_btn: "Set to 0.5 ms",
        reset_btn: "Restore Default",
        status: "Timer resolution optimized successfully!",
      },
      auto_purge: {
        title: "Intelligent Auto-Purge Service",
        desc: "Monitors and automatically flushes the Standby List when thresholds are met.",
        enable_lbl: "Enable Background Intelligent Standby Cleaner",
        threshold_avail: "Purge when Available Memory is below:",
        threshold_standby: "Purge when Standby Cache list is above:",
        status_enabled: "Standby cleaner daemon started in background.",
        status_disabled: "Standby cleaner daemon stopped.",
      },
      purge_now: "Purge Standby List Now",
      purge_success: "Standby list cache cleared successfully!",
    },
    tweaker: {
      title: "Windows Core Tweaker",
      subtitle: "Optimize operating system configuration, scheduler and graphics performance.",
      core_header: "Core & OS Tweaker",
      gpu_header: "GPU Bridge",
      reboot_warning: "⚠ Reboot Required",
      hags: {
        title: "Hardware-Accelerated GPU Scheduling (HAGS)",
        desc: "Reduces latency and improves performance by allowing the graphics card to manage its own memory.",
        btn_enable: "Enable HAGS",
        btn_disable: "Disable HAGS",
        status_enabled: "HAGS enabled successfully. Please reboot Windows to apply changes.",
        status_disabled: "HAGS disabled successfully. Please reboot Windows to apply changes.",
        error_auth: "Access Denied. You must run XMost-Optimizer as Administrator to modify graphics driver registry values.",
      },
      power: {
        title: "Ultimate Performance",
        desc: "Injects and activates the hidden Windows Ultimate Performance power scheme to prevent aggressive downclocking.",
        btn: "Activate Ultimate Power Plan",
        applying: "Applying...",
        status_title: "Power Optimization",
      },
      parking: {
        title: "Disable Core Parking",
        desc: "Forces all CPU cores to remain active during operation by overriding powercfg parking indexes.",
        btn: "Disable CPU Core Parking",
        applying: "Applying...",
        status_title: "CPU Core Tuning",
      },
      game_mode: {
        title: "Windows Game Mode",
        desc: "Prioritizes gaming threads and blocks background Windows Updates during gameplay.",
        btn_enable: "Enable Game Mode",
        btn_disable: "Disable Game Mode",
        status_enabled: "Game Mode enabled successfully.",
        status_disabled: "Game Mode disabled successfully.",
      }
    }
  },
  id: {
    nav: {
      monitor: "Monitor",
      memory: "Memori",
      tweaker: "Tweaker",
      settings: "Pengaturan",
    },
    common: {
      unknown: "Tidak Diketahui",
      total: "Total",
      used: "Digunakan",
      available: "Tersedia",
      status: "Status",
      enabled: "Aktif",
      disabled: "Nonaktif",
      save: "Simpan",
      success: "Sukses",
      error: "Error",
      warning: "Peringatan",
      info: "Informasi",
      close: "Tutup",
    },
    settings: {
      title: "Pengaturan",
      subtitle: "Ubah bahasa, tema, dan perilaku aplikasi.",
      language: {
        title: "Bahasa / Language",
        description: "Pilih bahasa tampilan antarmuka pengguna.",
        select: "Pilih Bahasa",
      },
      theme: {
        title: "Tema Aplikasi",
        description: "Beralih antara warna mode terang dan gelap.",
        dark: "Mode Gelap",
        light: "Mode Terang",
      },
      about: {
        title: "Tentang XMost Optimizer",
        version: "Versi",
        build: "Target OS: Windows 10/11",
        description: "Aplikasi utilitas optimalisasi sistem profesional yang dibuat menggunakan Tauri dan SvelteKit.",
      }
    },
    monitor: {
      title: "Telemetri Sistem",
      subtitle: "Monitor spesifikasi perangkat keras dan penggunaan waktu nyata",
      os: {
        title: "Sistem Operasi",
        subtitle: "Edisi & build Windows yang aktif",
      },
      cpu: {
        title: "Spesifikasi Prosesor",
        subtitle: "Detail Core & frekuensi CPU",
        name: "Nama",
        codename: "Codename",
        technology: "Teknologi",
        speed: "Clock Dasar",
        cores: "Core/Thread",
      },
      gpu: {
        title: "Pengendali Grafis",
        subtitle: "Detail Adaptor GPU & driver",
        name: "Nama",
        codename: "Codename",
        technology: "Teknologi",
        vram: "Ukuran VRAM",
        driver: "Versi Driver",
      },
      ram: {
        title: "Profil Memori",
        subtitle: "Telemetri SPD dinamis",
        brand: "Merek",
        type: "Tipe",
        speed: "Kecepatan",
        layout: "Tata Letak",
      },
      mobo: {
        title: "Motherboard",
        subtitle: "Platform Baseboard",
      },
      bios: {
        title: "Firmware BIOS",
        subtitle: "BIOS Motherboard SMBIOS",
        brand: "Merek",
        version: "Versi",
        date: "Tanggal",
      },
      usage: {
        cpu_load: "Total Beban CPU",
        ram_load: "Penggunaan Memori RAM",
        ram_in_use: "Digunakan",
        ram_total: "Kapasitas Total",
      }
    },
    memory: {
      title: "Orkestrator Memori",
      subtitle: "Optimalkan memori sistem dan daftar standby secara waktu nyata.",
      standby: {
        title: "Memori Standby",
        desc: "Berisi file cache dan data yang tidak aktif digunakan tetapi disimpan di RAM.",
      },
      free: {
        title: "Memori Bebas",
        desc: "RAM yang berisi halaman kosong dan dapat langsung dialokasikan.",
      },
      avail: {
        title: "Memori Tersedia",
        desc: "Total memori yang siap digunakan, termasuk daftar cache standby.",
      },
      total: {
        title: "Kapasitas Total",
        desc: "Kapasitas RAM fisik yang dilaporkan oleh BIOS motherboard.",
      },
      pagefile: {
        title: "Metrik Pagefile Windows",
        desc: "Menampilkan penggunaan penyimpanan file halaman aktif pada drive sistem sekunder.",
        used: "Digunakan",
        total: "Total Ukuran Pagefile",
        usage: "Persentase Penggunaan",
      },
      timer: {
        title: "Resolusi Timer Presisi Tinggi",
        desc: "Resolusi timer interupsi kernel aktif. Nilai yang lebih rendah mengurangi latensi game.",
        current: "Resolusi Saat Ini",
        target: "Resolusi Target",
        set_btn: "Atur ke 0,5 ms",
        reset_btn: "Kembalikan Default",
        status: "Resolusi timer berhasil dioptimalkan!",
      },
      auto_purge: {
        title: "Layanan Pembersihan Otomatis Pintar",
        desc: "Memantau dan membersihkan Daftar Standby secara otomatis saat mencapai ambang batas.",
        enable_lbl: "Aktifkan Pembersih Standby Latar Belakang Pintar",
        threshold_avail: "Bersihkan saat Memori Tersedia kurang dari:",
        threshold_standby: "Bersihkan saat Cache Standby lebih dari:",
        status_enabled: "Layanan pembersih standby dimulai di latar belakang.",
        status_disabled: "Layanan pembersih standby dihentikan.",
      },
      purge_now: "Bersihkan Daftar Standby Sekarang",
      purge_success: "Cache daftar standby berhasil dibersihkan!",
    },
    tweaker: {
      title: "Windows Core Tweaker",
      subtitle: "Optimalkan konfigurasi sistem operasi, scheduler, dan performa grafis.",
      core_header: "Tweaker Core & OS",
      gpu_header: "GPU Bridge",
      reboot_warning: "⚠ Restart Diperlukan",
      hags: {
        title: "Hardware-Accelerated GPU Scheduling (HAGS)",
        desc: "Mengurangi latensi dan meningkatkan performa dengan membiarkan kartu grafis mengelola memorinya sendiri.",
        btn_enable: "Aktifkan HAGS",
        btn_disable: "Nonaktifkan HAGS",
        status_enabled: "HAGS berhasil diaktifkan. Silakan restart Windows untuk menerapkan perubahan.",
        status_disabled: "HAGS berhasil dinonaktifkan. Silakan restart Windows untuk menerapkan perubahan.",
        error_auth: "Akses Ditolak. Anda harus menjalankan XMost-Optimizer sebagai Administrator untuk mengubah nilai registri driver grafis.",
      },
      power: {
        title: "Kinerja Maksimal",
        desc: "Memasukkan dan mengaktifkan skema daya Windows Ultimate Performance yang tersembunyi untuk mencegah penurunan clock rate yang agresif.",
        btn: "Aktifkan Ultimate Power Plan",
        applying: "Menerapkan...",
        status_title: "Optimalisasi Daya",
      },
      parking: {
        title: "Nonaktifkan Core Parking",
        desc: "Memaksa semua core CPU tetap aktif selama beroperasi dengan mengesampingkan indeks parkir powercfg.",
        btn: "Nonaktifkan CPU Core Parking",
        applying: "Menerapkan...",
        status_title: "Tuning Core CPU",
      },
      game_mode: {
        title: "Windows Game Mode",
        desc: "Memprioritaskan thread game dan memblokir Pembaruan Windows di latar belakang saat bermain game.",
        btn_enable: "Aktifkan Game Mode",
        btn_disable: "Nonaktifkan Game Mode",
        status_enabled: "Game Mode berhasil diaktifkan.",
        status_disabled: "Game Mode berhasil dinonaktifkan.",
      }
    }
  }
};

class LocaleManager {
  current = $state<'en' | 'id'>('en');

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lang');
      if (saved === 'id' || saved === 'en') {
        this.current = saved;
      }
    }
  }

  setLanguage(lang: 'en' | 'id') {
    this.current = lang;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang);
    }
  }

  t(key: string): string {
    const keys = key.split('.');
    let val: any = translations[this.current];
    for (const k of keys) {
      if (val && val[k] !== undefined) {
        val = val[k];
      } else {
        // Fallback to English
        let fallbackVal: any = translations['en'];
        for (const fk of keys) {
          if (fallbackVal && fallbackVal[fk] !== undefined) {
            fallbackVal = fallbackVal[fk];
          } else {
            return key;
          }
        }
        return fallbackVal;
      }
    }
    return val;
  }
}

export const locale = new LocaleManager();
