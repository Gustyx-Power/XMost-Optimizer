import React, { useState } from 'react';
import { MonitorPlay, Settings, Zap } from 'lucide-react';
import clsx from 'clsx';

const LargeToggle = ({ 
  title, 
  description, 
  icon: Icon,
  isActive, 
  onToggle 
}: { 
  title: string, 
  description: string, 
  icon: any,
  isActive: boolean, 
  onToggle: () => void 
}) => {
  return (
    <div className="glass-card p-8 flex flex-col items-center justify-center relative overflow-hidden group">
      {/* Background glow when active */}
      {isActive && (
        <div className="absolute inset-0 bg-emerald-500/5 blur-3xl pointer-events-none" />
      )}
      
      <div className="flex flex-col items-center z-10 space-y-6">
        <div className={clsx(
          "p-4 rounded-2xl border transition-all duration-300",
          isActive 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
            : "bg-white/5 border-white/10 text-textSecondary"
        )}>
          <Icon size={40} />
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-textMuted max-w-xs">{description}</p>
        </div>

        <button 
          onClick={onToggle}
          className={clsx(
            "w-24 h-12 rounded-full transition-all duration-300 relative focus:outline-none border-2",
            isActive 
              ? "bg-emerald-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
              : "bg-white/5 border-white/20 hover:border-white/40"
          )}
        >
          <div className={clsx(
            "absolute top-1 left-1 w-9 h-9 rounded-full bg-white transition-transform duration-300 shadow-md flex items-center justify-center",
            isActive ? "transform translate-x-12" : ""
          )}>
            <div className={clsx(
              "w-3 h-3 rounded-full",
              isActive ? "bg-emerald-500" : "bg-dangerRed"
            )} />
          </div>
        </button>
        
        {/* Status text */}
        <div className={clsx(
          "font-mono text-sm tracking-widest font-bold",
          isActive ? "text-emerald-400" : "text-dangerRed"
        )}>
          {isActive ? "ENABLED" : "DISABLED"}
        </div>
      </div>
    </div>
  );
};

const GpuBridge = () => {
  const [hags, setHags] = useState(true);
  const [maxPerf, setMaxPerf] = useState(false);

  return (
    <div className="h-full flex flex-col space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">GPU Bridge</h1>
        <p className="text-sm text-textSecondary">Direct registry overrides and driver-level optimizations.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0 pt-4">
        <LargeToggle 
          title="Hardware-Accelerated GPU Scheduling (HAGS)"
          description="Reduces latency and improves performance by allowing the graphics card to manage its own memory."
          icon={Settings}
          isActive={hags}
          onToggle={() => setHags(!hags)}
        />
        
        <LargeToggle 
          title="Prefer Maximum Performance"
          description="Forces the GPU power management mode to maximum performance globally."
          icon={Zap}
          isActive={maxPerf}
          onToggle={() => setMaxPerf(!maxPerf)}
        />
      </div>
      
      {/* Footer Info */}
      <div className="mt-auto bg-warningOrange/10 border border-warningOrange/20 rounded-lg p-4 flex items-start space-x-3 text-warningOrange">
        <MonitorPlay size={20} className="mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <strong>Note:</strong> Changes to HAGS require a system restart to take effect. Maximum performance mode applies immediately but may increase power consumption and temperatures.
        </div>
      </div>
    </div>
  );
};

export default GpuBridge;
