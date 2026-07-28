import Link from "next/link";
import React from "react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background text-slate-50 flex flex-col relative overflow-hidden">
      
      {/* Background Decorators */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-400/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-400/5 blur-[120px] pointer-events-none" />
      
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 z-10 relative border-b border-white/5 bg-background/50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-gradient-primary flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            PariPari
          </span>
        </Link>
        <div className="flex gap-4">
          <Link href="/chat" className="text-sm font-medium border border-white/10 bg-white/5 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
            Back to Copilot
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 relative animate-fade-in w-full max-w-2xl mx-auto">
        <div className="w-full flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
            <p className="text-slate-400 text-sm mt-1">Configure API keys and model preferences.</p>
          </div>
        </div>

        <div className="w-full glass-panel p-8 relative overflow-hidden">
          
          <div className="space-y-8">
            {/* API Keys */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 font-mono flex items-center gap-2">
                <span className="text-cyan-400">🔑</span> API Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2 font-mono">
                    PARITOK_API_KEY
                  </label>
                  <input
                    type="password"
                    defaultValue="ptk_*****************************"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/50 transition-all font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 ml-1">Required for context compression. Get one at paritok.com.</p>
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2 font-mono">
                    GROQ_API_KEY
                  </label>
                  <input
                    type="password"
                    defaultValue="gsk_*****************************"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/50 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-white/5" />

            {/* Model Selection */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 font-mono flex items-center gap-2">
                <span className="text-violet-400">🧠</span> LLM Engine
              </h3>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2 font-mono">
                  DEFAULT_MODEL
                </label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-400/50 transition-all font-mono appearance-none"
                  defaultValue="llama3-70b"
                >
                  <option value="llama3-70b">llama-3.3-70b-versatile (Recommended)</option>
                  <option value="llama3-8b">llama-3-8b-instruct</option>
                  <option value="mixtral">mixtral-8x7b-32768</option>
                </select>
              </div>
            </div>

            <div className="h-px w-full bg-white/5" />

            {/* Danger Zone */}
            <div>
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4 font-mono flex items-center gap-2">
                ⚠️ Danger Zone
              </h3>
              <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                <div>
                  <h4 className="text-sm font-semibold text-white">Clear Repository Cache</h4>
                  <p className="text-xs text-slate-400 mt-1">Force a re-index of the currently loaded repository.</p>
                </div>
                <button className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all">
                  Clear Cache
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button className="w-full py-3 text-sm font-semibold text-white bg-gradient-primary rounded-xl transition-all glow-cyan-hover">
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
