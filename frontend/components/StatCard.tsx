"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  prefix?: string;
  highlight?: boolean;
  icon?: React.ReactNode;
  subtext?: string;
  animate?: boolean;
}

export function StatCard({
  label,
  value,
  suffix,
  prefix,
  highlight,
  icon,
  subtext,
  animate,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      prevRef.current = value;
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <motion.div
      initial={false}
      animate={{ scale: animate ? [1, 1.02, 1] : 1 }}
      transition={{ duration: 0.3 }}
      className={`
        relative overflow-hidden p-5 rounded-2xl transition-all duration-300 font-sans shadow-sm
        ${
          highlight
            ? "bg-brand-500/10 border border-brand-500/20"
            : "glass-panel glass-panel-hover"
        }
      `}
    >
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${highlight ? 'text-brand-400' : 'text-gray-400'}`}>
            {label}
          </p>
          <div
            className={`font-display font-semibold leading-none tabular-nums ${
              highlight ? "text-3xl text-foreground" : "text-2xl text-gray-100"
            }`}
          >
            {prefix && (
              <span className={highlight ? "text-brand-400 font-medium" : "text-gray-500 font-medium"}>
                {prefix}
              </span>
            )}
            {typeof displayValue === "number"
              ? displayValue.toLocaleString()
              : displayValue}
            {suffix && (
              <span
                className={`ml-1 font-medium ${
                  highlight ? "text-xl text-brand-400" : "text-lg text-gray-500"
                }`}
              >
                {suffix}
              </span>
            )}
          </div>
          {subtext && (
            <p className="mt-2 text-xs text-gray-500 font-medium">{subtext}</p>
          )}
        </div>

        {icon && (
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              highlight ? "bg-brand-500/20 text-brand-400 border border-brand-500/30" : "bg-white/5 border border-white/10 text-gray-400"
            }`}
          >
            {icon}
          </div>
        )}
      </div>
      
      {/* Subtle Background Glow for Highlighted Card */}
      {highlight && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
      )}
    </motion.div>
  );
}
