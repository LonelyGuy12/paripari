import { ChatPanel } from "@/components/ChatPanel";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden relative font-sans">
      {/* Background Decorators */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-brand-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />

      {/* Top header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-background/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center glow-brand text-brand-500 group-hover:bg-brand-500/20 transition-all">
              <Sparkles size={16} />
            </div>
            <span className="font-display font-semibold text-lg text-foreground tracking-tight">
              PariPari
            </span>
          </Link>
          <span className="hidden sm:block text-xs font-medium text-brand-400 border border-brand-500/20 bg-brand-500/5 rounded-full px-3 py-1">
            Copilot
          </span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            <span className="hidden sm:block">System Online</span>
          </div>
          <a
            href="https://github.com/LonelyGuy12/paripari"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-foreground transition-colors px-2 py-1"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            <span className="hidden sm:block">GitHub</span>
          </a>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative z-10">
        <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-background">
          <ChatPanel />
        </main>

      </div>
    </div>
  );
}
