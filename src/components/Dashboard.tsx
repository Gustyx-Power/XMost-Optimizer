import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Cpu, MonitorPlay, Zap, Thermometer, Activity } from 'lucide-react';

// Mock data for the Area Chart
const generateRamData = () => {
  const data = [];
  let used = 4000;
  let standby = 2000;
  for (let i = 0; i < 20; i++) {
    data.push({
      time: i,
      used: used,
      standby: standby,
      total: 16000
    });
    used += Math.floor(Math.random() * 400 - 200);
    standby += Math.floor(Math.random() * 200 - 100);
  }
  return data;
};

// Circular Gauge Component
const CircularGauge = ({ value, label, unit, color = "#00f0ff" }: { value: number, label: string, unit: string, color?: string }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg className="w-32 h-32 transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
          fill="transparent"
        />
        {/* Progress Circle */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center inset-0 pointer-events-none">
        <span className="text-2xl font-mono font-bold text-white tracking-tighter">
          {value}<span className="text-sm text-textSecondary">{unit}</span>
        </span>
      </div>
      <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider mt-2">{label}</span>
    </div>
  );
};

const Dashboard = () => {
  const [ramData, setRamData] = useState(generateRamData());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRamData(prev => {
        const newData = [...prev.slice(1)];
        const last = newData[newData.length - 1];
        newData.push({
          time: last.time + 1,
          used: last.used + Math.floor(Math.random() * 400 - 200),
          standby: last.standby + Math.floor(Math.random() * 200 - 100),
          total: 16000
        });
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">System Telemetry</h1>
          <p className="text-sm text-textSecondary">Real-time performance monitoring and analytics.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-accentCyan bg-accentCyan/10 px-3 py-1.5 rounded-md border border-accentCyan/20">
          <Zap size={14} className="animate-pulse" />
          <span>POLLING RATE: 1000ms</span>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Hardware Identity */}
        <div className="flex flex-col space-y-6">
          <div className="glass-card p-5 h-full flex flex-col">
            <h2 className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-4 flex items-center">
              <Zap size={16} className="mr-2 text-accentCyan" /> Hardware Identity
            </h2>
            
            <div className="space-y-6 flex-1">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <Cpu size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-xs text-textSecondary font-medium">PROCESSOR</div>
                  <div className="font-mono text-sm text-white mt-1">AMD Ryzen 9 7950X3D</div>
                  <div className="text-xs text-textMuted font-mono">16 Cores / 32 Threads @ 4.2GHz</div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <MonitorPlay size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-xs text-textSecondary font-medium">GRAPHICS</div>
                  <div className="font-mono text-sm text-white mt-1">NVIDIA GeForce RTX 4090</div>
                  <div className="text-xs text-textMuted font-mono">24GB GDDR6X VRAM</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <Activity size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-xs text-textSecondary font-medium">MOTHERBOARD</div>
                  <div className="font-mono text-sm text-white mt-1">ROG CROSSHAIR X670E HERO</div>
                  <div className="text-xs text-textMuted font-mono">BIOS Ver. 1415</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Memory Area Chart */}
        <div className="lg:col-span-2 glass-card p-5 flex flex-col">
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-textSecondary uppercase tracking-wider flex items-center">
              <Activity size={16} className="mr-2 text-accentBlue" /> Memory Orchestration
            </h2>
            <div className="flex space-x-4 text-xs font-mono">
               <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-accentCyan mr-2 shadow-[0_0_5px_#00f0ff]"></div>Used</div>
               <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-accentBlue mr-2 shadow-[0_0_5px_#0066ff]"></div>Standby</div>
            </div>
           </div>
           
           <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ramData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorStandby" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0066ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis 
                  domain={[0, 16000]} 
                  tick={{ fill: '#555', fontSize: 10, fontFamily: 'monospace' }}
                  tickFormatter={(val) => `${val / 1000}G`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121212', borderColor: '#333', borderRadius: '8px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="used" 
                  stroke="#00f0ff" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorUsed)" 
                  animationDuration={300}
                />
                <Area 
                  type="monotone" 
                  dataKey="standby" 
                  stroke="#0066ff" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorStandby)" 
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Bottom Row: Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-4 flex justify-center items-center">
          <CircularGauge value={42} label="CPU Temp" unit="°C" color="#00f0ff" />
        </div>
        <div className="glass-card p-4 flex justify-center items-center">
          <CircularGauge value={28} label="CPU Usage" unit="%" color="#0066ff" />
        </div>
        <div className="glass-card p-4 flex justify-center items-center">
          <CircularGauge value={65} label="GPU Temp" unit="°C" color="#ff8a00" />
        </div>
        <div className="glass-card p-4 flex justify-center items-center">
          <CircularGauge value={85} label="GPU Usage" unit="%" color="#ff2a2a" />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
