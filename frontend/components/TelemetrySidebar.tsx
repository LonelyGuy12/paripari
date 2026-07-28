"use client";

import { useTelemetry } from "@/hooks/useTelemetry";
import { StatCard } from "./StatCard";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Gauge, Database, ArrowDownToLine, Zap, CheckCircle2 } from "lucide-react";

function TokenBar({ original, compressed }: { original: number; compressed: number }) {
  const ratio = original > 0 ? compressed / original : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
        <span>Original Context</span>
        <span>{original.toLocaleString()} TOK</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gray-500"
        />
      </div>

      <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-brand-400 mt-2">
        <span>Compressed</span>
        <span>{compressed.toLocaleString()} TOK</span>
      </div>
      <div className="h-2 w-full bg-brand-500/10 rounded-full overflow-hidden border border-brand-500/20">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-brand-500 glow-brand rounded-r-full"
        />
      </div>

      <div className="flex justify-between text-xs mt-5 pt-4 border-t border-white/5 font-semibold uppercase tracking-wider">
        <span className="text-blue-400 flex items-center gap-1.5"><ArrowDownToLine size={14} /> Tokens Saved</span>
        <span className="text-blue-400 font-bold tabular-nums">
          {(original - compressed).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function PulsingDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {active && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75 animate-ping" />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
          active ? "bg-brand-500 glow-brand" : "bg-gray-700"
        }`}
      />
    </span>
  );
}

export function TelemetrySidebar() {
  const { data, isLoading, error, lastUpdated } = useTelemetry();
  const prevData = useRef(data);
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    if (data && prevData.current && data.total_requests !== prevData.current.total_requests) {
      setFlashKey((k) => k + 1);
    }
    prevData.current = data;
  }, [data]);

  return (
    <aside className="flex flex-col h-full bg-background/50 overflow-y-auto w-full font-sans border-l border-white/5 relative">

      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-5 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl border border-brand-500/20 bg-brand-500/10 flex items-center justify-center glow-brand">
              <Activity className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground tracking-wide">Telemetry Sys</h3>
                <PulsingDot active={!error && !isLoading} />
              </div>
              <p className="text-xs font-medium text-gray-500 mt-0.5">
                {error
                  ? "Status: Offline"
                  : lastUpdated
                  ? `Sync: ${lastUpdated.toLocaleTimeString()}`
                  : "Status: Connecting..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 relative z-10">
        {/* Hero: Compression Ratio */}
        <div className="glass-panel p-8 text-center bg-brand-500/5 border-brand-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-[40px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-4 flex items-center justify-center gap-2">
            <Gauge size={14} /> Compression Ratio
          </p>
          <motion.div 
            key={flashKey}
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-display font-semibold text-6xl leading-none tabular-nums text-foreground drop-shadow-sm"
          >
            <span>
              {isLoading ? "–" : `${data?.compression_ratio?.toFixed(1) ?? "0.0"}`}
            </span>
            <span className="text-3xl text-brand-400 ml-1 font-medium">%</span>
          </motion.div>
          
          {data && data.compression_ratio >= 70 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-400 shadow-sm"
            >
              <CheckCircle2 size={14} />
              {data.compression_ratio >= 90 ? "Critical Efficiency" : data.compression_ratio >= 80 ? "High Efficiency" : "Optimal Efficiency"}
            </motion.div>
          )}
        </div>

        {/* Cost Saved */}
        <StatCard
          label="Est. Cost Saved"
          value={data ? Number(data.estimated_cost_saved.toFixed(4)) : 0}
          prefix="$"
          highlight
          icon={<span className="text-lg">💰</span>}
          subtext="vs. full context"
          animate={flashKey > 0}
        />

        {/* Token bar chart */}
        <div className="glass-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6 flex items-center justify-between">
            <span>Token Breakdown</span>
            <Database className="w-4 h-4 text-gray-500" />
          </p>
          {isLoading || !data ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-2 rounded-full bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <TokenBar
              original={data.original_tokens}
              compressed={data.compressed_tokens}
            />
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Requests"
            value={data?.total_requests ?? 0}
            icon={<Zap size={16} />}
            subtext="LLM calls"
          />
          <StatCard
            label="Original"
            value={data?.original_tokens ?? 0}
            icon={<Database size={16} />}
            subtext="tokens before"
          />
          <StatCard
            label="Compressed"
            value={data?.compressed_tokens ?? 0}
            icon={<ArrowDownToLine size={16} />}
            subtext="sent to LLM"
          />
          <StatCard
            label="Saved"
            value={data ? data.original_tokens - data.compressed_tokens : 0}
            icon={<span className="text-sm font-bold">SAV</span>}
            subtext="not billed"
          />
        </div>

        {/* Paritok info */}
        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-center mt-8 backdrop-blur-sm">
          <p className="text-xs text-gray-400 font-medium tracking-wide">
            Traffic routed through <span className="text-foreground">Paritok</span> proxy.
          </p>
          <a
            href="https://paritok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            View Documentation <span className="text-[10px]">↗</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
