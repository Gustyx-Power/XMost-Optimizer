import React, { useState } from 'react';
import { Bot, User, ShieldCheck, ShieldAlert, Sparkles, Send } from 'lucide-react';
import clsx from 'clsx';

const RECOMMENDATIONS = [
  {
    id: 1,
    title: "Disable HPET (High Precision Event Timer)",
    description: "HPET can cause micro-stutters in some games. Disabling it forces the system to use TSC (Time Stamp Counter) which has lower latency.",
    severity: "aggressive",
    status: "pending"
  },
  {
    id: 2,
    title: "Enable Game Mode",
    description: "Prioritizes gaming resources and prevents Windows Update from performing driver installations or sending restart notifications.",
    severity: "safe",
    status: "applied"
  }
];

const CHAT_HISTORY = [
  { sender: 'bot', text: "System analysis complete. I've found a few areas we can optimize for lower latency. Would you like to review them?" },
  { sender: 'user', text: "Yes, show me what you found." },
  { sender: 'bot', text: "I've generated 2 recommendations. One is a safe OS-level change, the other is an aggressive timer change that may improve 1% lows in competitive games." }
];

const SmartAdvisor = () => {
  const [chat, setChat] = useState(CHAT_HISTORY);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setChat([...chat, { sender: 'user', text: input }]);
    setInput('');
    
    // Fake bot response
    setTimeout(() => {
      setChat(prev => [...prev, { sender: 'bot', text: "I'm a static demo, but in the real app I would process your request and analyze system telemetry!" }]);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Smart Advisor</h1>
        <p className="text-sm text-textSecondary">AI-driven telemetry analysis and tailored optimizations.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
        
        {/* Chat Interface (Left - 3 columns) */}
        <div className="lg:col-span-3 glass-card flex flex-col overflow-hidden relative">
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-accentCyan via-accentBlue to-accentCyan" />
          
          <div className="p-4 border-b border-white/5 flex items-center space-x-3 bg-white/5">
            <div className="p-2 bg-accentCyan/20 rounded-lg border border-accentCyan/30">
              <Sparkles size={20} className="text-accentCyan" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">XMOST AI Assistant</h2>
              <div className="text-xs text-accentCyan flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-accentCyan mr-1.5 animate-pulse" />
                Online & Analyzing
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {chat.map((msg, idx) => (
              <div key={idx} className={clsx("flex", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                <div className={clsx("max-w-[80%] flex space-x-3", msg.sender === 'user' ? "flex-row-reverse space-x-reverse" : "")}>
                  <div className="flex-shrink-0 mt-1">
                    {msg.sender === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-surfaceHighlight flex items-center justify-center border border-white/10">
                        <User size={16} className="text-textSecondary" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accentCyan/20 flex items-center justify-center border border-accentCyan/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                        <Bot size={16} className="text-accentCyan" />
                      </div>
                    )}
                  </div>
                  <div className={clsx(
                    "p-3 rounded-2xl text-sm",
                    msg.sender === 'user' 
                      ? "bg-accentBlue/20 text-white border border-accentBlue/30 rounded-tr-sm" 
                      : "bg-white/5 text-textPrimary border border-white/10 rounded-tl-sm shadow-md"
                  )}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-background/50">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about optimizing your system..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-accentCyan focus:ring-1 focus:ring-accentCyan transition-all"
              />
              <button 
                type="submit"
                className="absolute right-2 p-2 bg-accentCyan/20 text-accentCyan hover:bg-accentCyan hover:text-black rounded-lg transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* Recommendations (Right - 2 columns) */}
        <div className="lg:col-span-2 flex flex-col space-y-4 overflow-y-auto custom-scrollbar pr-2">
          <h2 className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-2">
            Actionable Insights
          </h2>
          
          {RECOMMENDATIONS.map(rec => (
            <div key={rec.id} className="glass-card p-5 border-l-4" style={{ borderLeftColor: rec.severity === 'safe' ? '#10b981' : '#ff8a00' }}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  {rec.severity === 'safe' 
                    ? <ShieldCheck size={16} className="text-emerald-500" />
                    : <ShieldAlert size={16} className="text-warningOrange" />
                  }
                  <span className={clsx(
                    "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                    rec.severity === 'safe' ? "bg-emerald-500/10 text-emerald-400" : "bg-warningOrange/10 text-warningOrange"
                  )}>
                    {rec.severity}
                  </span>
                </div>
                {rec.status === 'applied' && (
                  <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10">APPLIED</span>
                )}
              </div>
              
              <h3 className="text-md font-bold text-white mb-2">{rec.title}</h3>
              <p className="text-xs text-textSecondary mb-4 leading-relaxed">{rec.description}</p>
              
              {rec.status === 'pending' && (
                <button className="w-full py-2 bg-white/5 hover:bg-accentCyan/20 border border-white/10 hover:border-accentCyan/50 text-white text-sm font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  Apply Optimization
                </button>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default SmartAdvisor;
