"use client";

import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Terminal, Cpu, Activity, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const containerVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: import("framer-motion").Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-sans">
      
      {/* Subtle Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-gradient-subtle" />
      
      {/* Navbar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex items-center justify-between px-6 py-5 z-10 relative border-b border-white/5 bg-background/60 backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center glow-brand text-brand-500">
            <Sparkles size={18} />
          </div>
          <span className="font-display font-semibold text-xl tracking-tight text-foreground">
            PariPari
          </span>
        </div>
        <div className="flex gap-6 items-center">
          <a href="https://github.com/LonelyGuy12/paripari" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-foreground transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            GitHub
          </a>
          <Link href="/chat" className="text-sm font-medium bg-white text-black px-5 py-2 rounded-full hover:scale-105 hover:bg-gray-100 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]">
            Launch
          </Link>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 z-10 relative py-32 text-center max-w-5xl mx-auto w-full">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 text-brand-400 text-xs font-medium tracking-wide mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
          </span>
          System Online &middot; Repo-Aware Copilot
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-5xl md:text-7xl font-semibold tracking-tight max-w-4xl leading-[1.1] mb-6 text-foreground"
        >
          AI that sees <span className="text-gradient-brand">everything.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed"
        >
          PariPari uses Paritok compression to map entire codebases into a minimal token footprint, granting your AI omniscient repository awareness at a fraction of the cost.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full items-center justify-center"
        >
          <Link 
            href="/chat" 
            className="group inline-flex items-center justify-center px-8 py-3.5 rounded-full font-semibold text-black bg-white hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
          >
            Launch Copilot
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </main>

      {/* Features Grid */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="w-full max-w-6xl mx-auto px-6 pb-24 z-10 relative"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <motion.div variants={itemVariants} className="glass-panel p-8 glass-panel-hover flex flex-col group">
            <div className="w-12 h-12 rounded-xl bg-gray-800/50 border border-white/5 flex items-center justify-center mb-6 text-gray-300 group-hover:text-brand-400 group-hover:border-brand-500/30 transition-all duration-300">
              <Terminal size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Semantic Index</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Crawl and compress entire repos into semantic maps. Creates a persistent knowledge structure of your entire codebase.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass-panel p-8 glass-panel-hover flex flex-col group">
            <div className="w-12 h-12 rounded-xl bg-gray-800/50 border border-white/5 flex items-center justify-center mb-6 text-gray-300 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all duration-300">
              <Cpu size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Top-Down Nav</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Navigate massive repos instantly. The agent reads the map and surgically queries only the exact files it needs.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-8 glass-panel-hover flex flex-col group">
            <div className="w-12 h-12 rounded-xl bg-gray-800/50 border border-white/5 flex items-center justify-center mb-6 text-gray-300 group-hover:text-brand-400 group-hover:border-brand-500/30 transition-all duration-300">
              <Activity size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Telemetry</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Real-time dashboard tracking compression savings. Verifiable 95% token reduction for maximum efficiency.
            </p>
          </motion.div>

        </div>
      </motion.section>

      <footer className="w-full py-8 text-center text-gray-500 text-sm border-t border-white/5 bg-background/40 backdrop-blur-sm z-10 relative">
        <p className="flex items-center justify-center gap-2">
          Powered by <a href="https://paritok.com" target="_blank" rel="noreferrer" className="text-foreground hover:text-brand-400 transition-colors font-medium">Paritok Compression</a>
        </p>
      </footer>
    </div>
  );
}
