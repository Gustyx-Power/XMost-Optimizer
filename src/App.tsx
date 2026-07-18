import { useState } from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  HardDrive, 
  MonitorPlay, 
  MessageSquareWarning 
} from 'lucide-react';
import clsx from 'clsx';

// Placeholder components
import Dashboard from './components/Dashboard';
import MemoryOrchestrator from './components/MemoryOrchestrator';
import WindowsCore from './components/WindowsCore';
import GpuBridge from './components/GpuBridge';
import SmartAdvisor from './components/SmartAdvisor';

const TABS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', component: Dashboard },
  { id: 'memory', icon: HardDrive, label: 'Memory Orchestrator', component: MemoryOrchestrator },
  { id: 'core', icon: Cpu, label: 'Windows Core', component: WindowsCore },
  { id: 'gpu', icon: MonitorPlay, label: 'GPU Bridge', component: GpuBridge },
  { id: 'advisor', icon: MessageSquareWarning, label: 'Smart Advisor', component: SmartAdvisor },
];

function App() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || Dashboard;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-textPrimary">
      {/* Sidebar Navigation */}
      <nav className="w-16 h-full flex flex-col items-center py-6 glass-panel z-10 space-y-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accentCyan to-accentBlue flex items-center justify-center shadow-lg shadow-accentCyan/20 mb-4">
          <span className="font-bold text-lg tracking-tighter">X</span>
        </div>
        
        <div className="flex flex-col space-y-4 w-full px-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                className={clsx(
                  "p-3 rounded-xl flex items-center justify-center transition-all duration-300 relative group",
                  isActive 
                    ? "bg-white/10 text-accentCyan box-glow-cyan" 
                    : "text-textSecondary hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute left-0 w-1 h-8 bg-accentCyan rounded-r-full shadow-[0_0_10px_#00f0ff]" />
                )}
                
                {/* Tooltip */}
                <div className="absolute left-16 bg-surfaceHighlight px-3 py-1.5 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10 z-50">
                  {tab.label}
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-full relative overflow-y-auto overflow-x-hidden p-6">
        {/* Subtle background radial gradient for depth */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accentCyan/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accentBlue/5 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 h-full">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}

export default App;
