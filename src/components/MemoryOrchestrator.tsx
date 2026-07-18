import React, { useState } from 'react';
import { Settings2, Zap, Clock, HardDrive } from 'lucide-react';
import clsx from 'clsx';

const MemoryOrchestrator = () => {
  const [isFlushing, setIsFlushing] = useState(false);
  const [autoPurge, setAutoPurge] = useState(true);
  const [threshold, setThreshold] = useState(1024);
  const [timerRes, setTimerRes] = useState(0.5);

  const handleFlush = () => {
    setIsFlushing(true);
    setTimeout(() => setIsFlushing(false), 800);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Memory Orchestrator</h1>
        <p className="text-sm text-textSecondary">Advanced standby list and working set management.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Left Column: Actions & Status */}
        <div className="flex flex-col space-y-6">
          <div className="glass-card p-8 flex-1 flex flex-col items-center justify-center relative overflow-hidden group">
            {/* Background ripple effect */}
            {isFlushing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-32 h-32 bg-accentCyan/30 rounded-full animate-ripple" />
              </div>
            )}
            
            <button
              onClick={handleFlush}
              disabled={isFlushing}
              className={clsx(
                "relative z-10 w-64 h-64 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300",
                isFlushing 
                  ? "border-accentCyan bg-accentCyan/10 shadow-[0_0_50px_rgba(0,240,255,0.5)] scale-95" 
                  : "border-white/10 hover:border-accentCyan/50 hover:bg-white/5 shadow-2xl hover:shadow-[0_0_30px_rgba(0,240,255,0.2)]"
              )}
            >
              <Zap size={48} className={clsx("mb-4", isFlushing ? "text-accentCyan" : "text-textSecondary group-hover:text-white")} />
              <span className={clsx("text-xl font-bold tracking-widest uppercase", isFlushing ? "text-accentCyan text-glow-cyan" : "text-white")}>
                {isFlushing ? "Purging..." : "Flush Memory"}
              </span>
              <span className="text-xs text-textMuted mt-2 font-mono">STANDBY LIST & WORKING SET</span>
            </button>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="flex flex-col space-y-6">
          <div className="glass-card p-6 flex flex-col space-y-8">
            <h2 className="text-sm font-semibold text-textSecondary uppercase tracking-wider flex items-center border-b border-white/5 pb-4">
              <Settings2 size={16} className="mr-2 text-accentBlue" /> Automation Policies
            </h2>
            
            {/* Auto Purge Setting */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <HardDrive size={20} className="text-accentCyan" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Auto-Purge Standby List</div>
                    <div className="text-xs text-textMuted">Trigger automatically based on threshold</div>
                  </div>
                </div>
                {/* Custom Toggle */}
                <button 
                  onClick={() => setAutoPurge(!autoPurge)}
                  className={clsx(
                    "w-12 h-6 rounded-full transition-colors duration-300 relative focus:outline-none",
                    autoPurge ? "bg-accentCyan shadow-[0_0_10px_rgba(0,240,255,0.3)]" : "bg-white/10"
                  )}
                >
                  <div className={clsx(
                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300",
                    autoPurge ? "transform translate-x-6" : ""
                  )} />
                </button>
              </div>
              
              <div className={clsx("pl-12 pr-4 transition-opacity duration-300", autoPurge ? "opacity-100" : "opacity-40 pointer-events-none")}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-textSecondary">Threshold Trigger</span>
                  <span className="font-mono text-accentCyan">{threshold} MB</span>
                </div>
                <input 
                  type="range" 
                  min="512" 
                  max="8192" 
                  step="512"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accentCyan"
                />
                <div className="flex justify-between text-[10px] text-textMuted font-mono mt-1">
                  <span>512M</span>
                  <span>8192M</span>
                </div>
              </div>
            </div>

            {/* Timer Resolution Setting */}
            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <Clock size={20} className="text-accentBlue" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Custom Timer Resolution</div>
                    <div className="text-xs text-textMuted">System-wide timer polling interval (Requires reboot)</div>
                  </div>
                </div>
              </div>
              
              <div className="pl-12 flex space-x-4 items-center">
                <div className="relative">
                  <input 
                    type="number" 
                    value={timerRes}
                    onChange={(e) => setTimerRes(Number(e.target.value))}
                    step="0.5"
                    min="0.5"
                    max="15.6"
                    className="bg-background border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-accentBlue focus:ring-1 focus:ring-accentBlue w-24 text-center"
                  />
                  <span className="absolute right-3 top-2 text-xs text-textMuted pointer-events-none">ms</span>
                </div>
                
                {/* Live Preview Indicator */}
                <div className="flex-1 bg-background/50 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                  <span className="text-xs text-textSecondary">Expected Latency</span>
                  <div className="flex items-center space-x-2">
                    <span className={clsx(
                      "font-mono text-sm",
                      timerRes <= 0.5 ? "text-accentCyan text-glow-cyan" : timerRes <= 1.0 ? "text-white" : "text-warningOrange"
                    )}>
                      {timerRes.toFixed(4)} ms
                    </span>
                    <div className={clsx(
                      "w-2 h-2 rounded-full",
                      timerRes <= 0.5 ? "bg-accentCyan animate-pulse" : timerRes <= 1.0 ? "bg-white/50" : "bg-warningOrange"
                    )} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryOrchestrator;
