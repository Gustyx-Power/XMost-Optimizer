import React, { useState } from 'react';
import { Cpu, Power, ShieldAlert, GripVertical, CheckCircle2, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const MOCK_CORES = [
  { id: 0, type: 'P-Core', assigned: 'System', load: 45 },
  { id: 1, type: 'P-Core', assigned: 'System', load: 32 },
  { id: 2, type: 'P-Core', assigned: 'Game', load: 89 },
  { id: 3, type: 'P-Core', assigned: 'Game', load: 92 },
  { id: 4, type: 'P-Core', assigned: 'Game', load: 88 },
  { id: 5, type: 'P-Core', assigned: 'Game', load: 95 },
  { id: 6, type: 'P-Core', assigned: 'Unassigned', load: 2 },
  { id: 7, type: 'P-Core', assigned: 'Unassigned', load: 5 },
  { id: 8, type: 'E-Core', assigned: 'Background', load: 15 },
  { id: 9, type: 'E-Core', assigned: 'Background', load: 12 },
  { id: 10, type: 'E-Core', assigned: 'Background', load: 18 },
  { id: 11, type: 'E-Core', assigned: 'Background', load: 14 },
];

const MOCK_SERVICES = [
  { id: 'sysmain', name: 'SysMain (Superfetch)', status: true, warning: true },
  { id: 'windows_update', name: 'Windows Update', status: true, warning: false },
  { id: 'diagtrack', name: 'Connected User Experiences (DiagTrack)', status: true, warning: true },
  { id: 'search', name: 'Windows Search', status: false, warning: false },
];

const POWER_PLANS = [
  { id: 'balanced', name: 'Balanced (Recommended)' },
  { id: 'high', name: 'High Performance' },
  { id: 'ultimate', name: 'Ultimate Performance' },
  { id: 'bitsum', name: 'Bitsum Highest Performance' },
];

const WindowsCore = () => {
  const [activePlan, setActivePlan] = useState('ultimate');
  const [services, setServices] = useState(MOCK_SERVICES);

  const toggleService = (id: string) => {
    setServices(services.map(s => s.id === id ? { ...s, status: !s.status } : s));
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Windows Core</h1>
        <p className="text-sm text-textSecondary">Deep-level OS optimizations, thread affinity, and power management.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Core Affinity (Takes 2 columns space) */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold text-textSecondary uppercase tracking-wider flex items-center">
              <Cpu size={16} className="mr-2 text-white" /> Thread Affinity Orchestration
            </h2>
            <div className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-md text-textMuted font-mono">
              DRAG TO REASSIGN
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {MOCK_CORES.map(core => (
              <div key={core.id} className="flex items-center bg-white/5 border border-white/5 hover:border-white/20 rounded-lg p-3 transition-colors group cursor-grab active:cursor-grabbing">
                <GripVertical size={16} className="text-textMuted mr-3 group-hover:text-white transition-colors" />
                
                <div className="w-16 font-mono text-sm text-white">
                  CPU {core.id.toString().padStart(2, '0')}
                </div>
                
                <div className="w-20">
                  <span className={clsx(
                    "text-xs px-2 py-0.5 rounded-full border",
                    core.type === 'P-Core' ? "bg-accentBlue/10 text-accentBlue border-accentBlue/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}>
                    {core.type}
                  </span>
                </div>
                
                <div className="flex-1 ml-4">
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all duration-500",
                        core.load > 80 ? "bg-warningOrange shadow-[0_0_5px_#ff8a00]" : "bg-accentCyan"
                      )}
                      style={{ width: `${core.load}%` }}
                    />
                  </div>
                </div>
                
                <div className="w-12 text-right ml-4 font-mono text-xs text-textSecondary">
                  {core.load}%
                </div>
                
                <div className="w-28 ml-6">
                  <span className={clsx(
                    "text-xs px-3 py-1 rounded-md border",
                    core.assigned === 'Game' ? "bg-accentCyan/10 text-accentCyan border-accentCyan/30 font-semibold" : 
                    core.assigned === 'System' ? "bg-white/10 text-white border-white/20" :
                    core.assigned === 'Background' ? "bg-surfaceHighlight text-textMuted border-white/5" :
                    "bg-transparent text-textMuted border-dashed border-white/10"
                  )}>
                    {core.assigned}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Power & Services */}
        <div className="flex flex-col space-y-6">
          
          {/* Power Plan */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-textSecondary uppercase tracking-wider flex items-center mb-4">
              <Power size={16} className="mr-2 text-accentCyan" /> Power Plan Profile
            </h2>
            
            <div className="space-y-3">
              {POWER_PLANS.map(plan => {
                const isActive = activePlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setActivePlan(plan.id)}
                    className={clsx(
                      "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-300",
                      isActive 
                        ? "bg-accentCyan/10 border-accentCyan text-white shadow-[0_0_15px_rgba(0,240,255,0.15)]" 
                        : "bg-background/50 border-white/5 text-textSecondary hover:bg-white/5 hover:border-white/20"
                    )}
                  >
                    <span className="text-sm font-medium">{plan.name}</span>
                    {isActive && (
                      <div className="flex items-center text-xs text-accentCyan font-semibold tracking-wider">
                        <CheckCircle2 size={14} className="mr-1" /> ACTIVE
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Windows Services */}
          <div className="glass-card p-6 flex-1 flex flex-col">
            <h2 className="text-sm font-semibold text-textSecondary uppercase tracking-wider flex items-center mb-4 border-b border-white/5 pb-4">
              <ShieldAlert size={16} className="mr-2 text-warningOrange" /> Background Services
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mt-2">
              {services.map(service => (
                <div key={service.id} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {service.warning && (
                      <AlertTriangle size={14} className="text-warningOrange" title="Known to impact gaming performance" />
                    )}
                    <span className={clsx("text-sm", service.warning ? "text-white" : "text-textSecondary")}>
                      {service.name}
                    </span>
                  </div>
                  
                  {/* Service Toggle */}
                  <button 
                    onClick={() => toggleService(service.id)}
                    className={clsx(
                      "w-10 h-5 rounded-full transition-colors duration-300 relative focus:outline-none",
                      service.status ? "bg-accentCyan" : "bg-white/10"
                    )}
                  >
                    <div className={clsx(
                      "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300",
                      service.status ? "transform translate-x-5" : ""
                    )} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WindowsCore;
