"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function OnboardingPage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "indexing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setStatus("indexing");
    // Simulate progress
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setStatus("success");
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background text-slate-50 flex flex-col relative overflow-hidden">
      
      {/* Background Decorators */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-cyan-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-violet-400/10 blur-[120px] pointer-events-none" />
      
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
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 relative animate-fade-in">
        <div className="w-full max-w-xl glass-panel p-8 md:p-12 text-center relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-400/20 blur-[50px] pointer-events-none rounded-full" />

          {status === "idle" && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-white tracking-tight mb-3">Connect Your Repository</h1>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                Enter a GitHub URL to begin indexing. PariPari will compress your codebase into a semantic map.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative text-left">
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2 font-mono">
                    GITHUB_URL
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    </span>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://github.com/owner/repo"
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/40 pl-12 pr-4 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:bg-black/60 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] glow-cyan-hover"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 text-sm font-semibold text-white bg-gradient-primary rounded-xl transition-all glow-cyan-hover"
                >
                  Start Indexing →
                </button>
              </form>
            </div>
          )}

          {status === "indexing" && (
            <div className="animate-fade-in text-left">
              <h2 className="text-xl font-bold text-white tracking-tight mb-2">Indexing Repository</h2>
              <p className="text-slate-400 text-xs font-mono mb-8">TARGET: {url}</p>

              <div className="space-y-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${progress >= 30 ? 'bg-green-400/20 text-green-400 border border-green-400/30' : 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'}`}>
                    {progress >= 30 ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <span className="animate-spin text-lg">⚙️</span>}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${progress >= 30 ? 'text-white' : 'text-cyan-400'}`}>Crawling repository files...</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${progress >= 70 ? 'bg-green-400/20 text-green-400 border border-green-400/30' : progress >= 30 ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30' : 'bg-white/5 border border-white/10 text-slate-500'}`}>
                    {progress >= 70 ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : progress >= 30 ? <span className="animate-spin text-lg">⚙️</span> : <span className="w-2 h-2 rounded-full bg-slate-500"></span>}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${progress >= 70 ? 'text-white' : progress >= 30 ? 'text-cyan-400' : 'text-slate-500'}`}>Compressing via Paritok...</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${progress >= 100 ? 'bg-green-400/20 text-green-400 border border-green-400/30' : progress >= 70 ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30' : 'bg-white/5 border border-white/10 text-slate-500'}`}>
                    {progress >= 100 ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : progress >= 70 ? <span className="animate-spin text-lg">⚙️</span> : <span className="w-2 h-2 rounded-full bg-slate-500"></span>}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${progress >= 100 ? 'text-white' : progress >= 70 ? 'text-cyan-400' : 'text-slate-500'}`}>Building semantic map...</p>
                  </div>
                </div>
              </div>

              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 mb-2">
                <div className="h-full bg-gradient-primary transition-all duration-300 glow-cyan" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] font-mono text-cyan-400 uppercase text-right tracking-widest">{progress}% COMPLETED</p>
            </div>
          )}

          {status === "success" && (
            <div className="animate-fade-in flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-green-400/20 border-2 border-green-400 text-green-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(74,222,128,0.3)]">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Repository Indexed</h2>
              <p className="text-slate-400 text-sm mb-8">
                127 files mapped and compressed. Ready for analysis.
              </p>
              <Link 
                href="/chat"
                className="w-full block py-4 text-sm font-semibold text-white bg-gradient-primary rounded-xl transition-all glow-cyan-hover"
              >
                Enter Copilot →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
