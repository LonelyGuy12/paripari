"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { streamChat, type AgentEvent, type ToolCall } from "@/lib/api";
import { CodeViewer } from "./CodeViewer";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Terminal, Loader2, Bot, User, Code2, Link as LinkIcon, Database, CheckCircle2 } from "lucide-react";

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
  if (typeof window !== "undefined" && window.location.port === "3001") return "http://localhost:8000";
  if (typeof window !== "undefined" && window.location.port === "3000") return "http://localhost:8000";
  return "";
};
const BACKEND = getBackendUrl();

const TOOL_LABELS: Record<string, string> = {
  list_directory: "Listing directory",
  read_file: "Reading file",
  propose_patch: "Proposing patch",
  write_pr_summary: "Writing PR summary",
  view_compressed_map: "Loading semantic map",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: ToolCall[];
}

interface ActiveTool {
  name: string;
  input: Record<string, unknown>;
}

const DEFAULT_REPO = "https://github.com/tiangolo/fastapi";
const DEFAULT_QUESTION = "Why is the response model not stripping extra fields?";

export function ChatPanel() {
  const [repoUrl, setRepoUrl] = useState(DEFAULT_REPO);
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [messages, setMessages] = useState<Message[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "code">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pre-index repo in background as soon as the URL changes
  useEffect(() => {
    if (!repoUrl || !repoUrl.includes("github.com/")) return;
    const timer = setTimeout(() => {
      fetch(`${BACKEND}/api/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl }),
      }).catch(() => {}); // fire-and-forget
    }, 800); // debounce 800ms
    return () => clearTimeout(timer);
  }, [repoUrl]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!repoUrl.trim() || !question.trim() || isRunning) return;

    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setToolCalls([]);
    setIsRunning(true);
    setActiveTool(null);
    setQuestion("");

    // Switch to code tab to show tool activity
    setActiveTab("code");

    try {
      let finalAnswer = "";
      let finalToolCalls: ToolCall[] = [];

      await streamChat(
        { repo_url: repoUrl, question },
        (event: AgentEvent) => {
          if (event.type === "tool_start") {
            setActiveTool({ name: event.tool!, input: event.input ?? {} });
          } else if (event.type === "tool_result") {
            const tc: ToolCall = {
              tool: event.tool!,
              input: event.input ?? {},
              output: event.output ?? "",
            };
            finalToolCalls = [...finalToolCalls, tc];
            setToolCalls((prev) => [...prev, tc]);
            setActiveTool(null);
            scrollToBottom();
          } else if (event.type === "final_answer") {
            finalAnswer = event.content ?? "";
            finalToolCalls = event.tool_calls ?? finalToolCalls;
            setToolCalls(finalToolCalls);
          } else if (event.type === "error") {
            finalAnswer = `❌ Error: ${event.message}`;
          }
        },
        () => {
          const assistantMsg: Message = {
            role: "assistant",
            content: finalAnswer,
            toolCalls: finalToolCalls,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setActiveTool(null);
          setIsRunning(false);
          setActiveTab("chat");
          scrollToBottom();
        }
      );
    } catch (err) {
      const errMsg: Message = {
        role: "assistant",
        content: `❌ ${err instanceof Error ? err.message : "Something went wrong"}`,
      };
      setMessages((prev) => [...prev, errMsg]);
      setIsRunning(false);
    }
  }, [repoUrl, question, isRunning, scrollToBottom]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 relative font-sans bg-background/50">
      
      {/* Repo URL bar */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/5 bg-background/80 backdrop-blur-md relative z-10">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
          <LinkIcon size={14} /> Target Repository
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-4 pr-4 py-2.5 text-sm font-medium text-foreground placeholder-gray-500 focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex px-6 pt-4 border-b border-white/5 bg-background/80 backdrop-blur-md relative z-10 gap-6">
        <button
          onClick={() => setActiveTab("chat")}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === "chat"
              ? "text-brand-400"
              : "text-gray-500 hover:text-gray-300"
          } flex items-center gap-2`}
        >
          <Terminal size={16} />
          Terminal
          {activeTab === "chat" && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400 glow-brand rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("code")}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === "code"
              ? "text-blue-400"
              : "text-gray-500 hover:text-gray-300"
          } flex items-center gap-2`}
        >
          <Code2 size={16} />
          Agent Protocol
          {toolCalls.length > 0 && (
            <span className="ml-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400 border border-blue-500/20">
              {toolCalls.length}
            </span>
          )}
          {activeTab === "code" && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 glow-blue rounded-t-full" />
          )}
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-6 py-6 relative z-10">
        {activeTab === "chat" ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center gap-5"
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center glow-brand mb-2 text-brand-400 shadow-lg">
                  <Database size={32} />
                </div>
                <h2 className="text-2xl font-display font-semibold text-foreground tracking-tight">
                  System Initialized
                </h2>
                <p className="text-sm text-gray-400 max-w-md leading-relaxed">
                  Repository index loaded via Paritok compression. Ready to trace logic, analyze architecture, and propose patches instantly.
                </p>
                <div className="mt-6 flex flex-col w-full max-w-md gap-3 justify-center">
                  {[
                    "Where is this bug coming from?",
                    "How does authentication work?",
                    "What's the DB schema?",
                  ].map((q, idx) => (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 + 0.2 }}
                      key={q}
                      onClick={() => setQuestion(q)}
                      className="glass-panel text-left px-5 py-3.5 text-sm font-medium text-gray-300 hover:text-white glass-panel-hover flex items-center justify-between group"
                    >
                      {q}
                      <CheckCircle2 size={16} className="text-brand-500/0 group-hover:text-brand-500/100 transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={i}
                  className={`flex gap-4 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 mt-1 flex items-center justify-center text-brand-400 shadow-sm">
                      <Bot size={18} />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-5 py-4 text-sm leading-relaxed rounded-2xl shadow-sm ${
                      msg.role === "user"
                        ? "bg-white text-black rounded-tr-sm"
                        : "bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm backdrop-blur-sm"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none break-words dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                         {msg.content}
                      </ReactMarkdown>
                    </div>
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <button
                        onClick={() => setActiveTab("code")}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
                      >
                        <Code2 size={14} />
                        {msg.toolCalls.length} Protocol Steps
                      </button>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 mt-1 shadow-sm">
                      <User size={18} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Active tool indicator */}
            {activeTool && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 mt-1 flex items-center justify-center text-brand-400 shadow-sm">
                  <Bot size={18} />
                </div>
                <div className="glass-panel px-5 py-4 text-sm max-w-[85%] rounded-2xl rounded-tl-sm">
                  <div className="flex items-center gap-3 text-brand-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="font-semibold text-sm">
                      {TOOL_LABELS[activeTool.name] ?? activeTool.name}
                    </span>
                  </div>
                  {typeof activeTool.input.path === 'string' && activeTool.input.path && (
                    <div className="mt-2 text-xs font-mono text-gray-400 bg-black/20 rounded px-2 py-1 inline-block">
                      {activeTool.input.path}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        ) : (
          <CodeViewer toolCalls={toolCalls} isRunning={isRunning} />
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 p-6 bg-background/80 backdrop-blur-md border-t border-white/5 relative z-20">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about the repository... (Press Enter to send)"
              rows={1}
              style={{ minHeight: "54px" }}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all shadow-sm"
              disabled={isRunning}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isRunning || !question.trim() || !repoUrl.trim()}
            className={`flex-shrink-0 h-[54px] w-[54px] rounded-xl flex items-center justify-center font-bold transition-all shadow-md ${
              isRunning || !question.trim()
                ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/10"
                : "bg-white text-black hover:scale-105 hover:bg-gray-100 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]"
            }`}
          >
            {isRunning ? (
              <Loader2 size={20} className="animate-spin text-brand-400" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
