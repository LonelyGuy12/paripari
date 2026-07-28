"use client";

import { motion } from "framer-motion";
import { FolderOpen, FileText, Wrench, FileEdit, Activity } from "lucide-react";

interface CodeViewerProps {
  toolCalls: Array<{
    tool: string;
    input: Record<string, unknown>;
    output: string;
  }>;
  activeFile?: string | null;
  patch?: string | null;
  isRunning?: boolean;
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  list_directory: <FolderOpen size={16} />,
  read_file: <FileText size={16} />,
  propose_patch: <Wrench size={16} />,
  write_pr_summary: <FileEdit size={16} />,
};

function isDiff(text: string): boolean {
  return text.startsWith("---") || text.startsWith("@@") || text.startsWith("+++ ");
}

function DiffView({ content }: { content: string }) {
  return (
    <pre className="text-xs font-mono leading-relaxed overflow-x-auto rounded-lg">
      {content.split("\n").map((line, i) => {
        let cls = "text-gray-400";
        if (line.startsWith("+") && !line.startsWith("+++")) cls = "text-brand-400 bg-brand-500/10";
        else if (line.startsWith("-") && !line.startsWith("---")) cls = "text-red-400 bg-red-500/10";
        else if (line.startsWith("@@")) cls = "text-blue-400 bg-blue-500/10";
        else if (line.startsWith("---") || line.startsWith("+++")) cls = "text-foreground font-semibold";
        return (
          <div key={i} className={`${cls} px-4 py-[2px]`}>
            {line || "\u00A0"}
          </div>
        );
      })}
    </pre>
  );
}

export function CodeViewer({ toolCalls, isRunning }: CodeViewerProps) {
  if (toolCalls.length === 0) {
    if (isRunning) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-brand-400 gap-6">
          <div className="relative flex items-center justify-center w-16 h-16 bg-brand-500/10 rounded-full">
            <Activity className="animate-pulse w-8 h-8" />
          </div>
          <p className="text-sm font-medium tracking-wide uppercase text-brand-400">Executing Protocol...</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-4">
        <div className="w-16 h-16 rounded-full border border-dashed border-gray-700 bg-white/5 flex items-center justify-center">
          <Activity className="w-6 h-6 opacity-50" />
        </div>
        <p className="text-sm font-medium uppercase tracking-wide">Awaiting Protocol Execution</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {toolCalls.map((tc, i) => {
        const icon = TOOL_ICONS[tc.tool] || <Activity size={16} />;
        const inputPath = (tc.input.path as string) || (tc.input.title as string) || "";
        const outputText = typeof tc.output === "string" ? tc.output : JSON.stringify(tc.output, null, 2);

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            className="glass-panel overflow-hidden"
          >
            {/* Tool header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 bg-white/5">
              <span className="text-brand-400 flex items-center justify-center bg-brand-500/10 p-1.5 rounded-md border border-brand-500/20">{icon}</span>
              <span className="text-sm font-semibold text-foreground tracking-wide capitalize">
                {tc.tool.replace(/_/g, " ")}
              </span>
              {inputPath && (
                <span className="text-xs text-gray-400 font-mono font-medium truncate ml-2 bg-black/20 px-2 py-1 rounded">
                  {inputPath}
                </span>
              )}
              <span className="ml-auto text-xs text-blue-400 font-semibold bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 tracking-wide">
                Step {i + 1}
              </span>
            </div>

            {/* Output */}
            <div className="p-0 max-h-96 overflow-y-auto bg-black/20">
              <div className="py-4 relative z-10">
                {isDiff(outputText) ? (
                  <DiffView content={outputText} />
                ) : (
                  <pre className="text-xs font-mono font-medium text-gray-300 leading-relaxed whitespace-pre-wrap break-words px-6">
                    {outputText}
                  </pre>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
