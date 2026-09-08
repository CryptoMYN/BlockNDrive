import React, { useState, useEffect } from "react";
import { Server, Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { getLighthouseStatus, type LighthouseStatusResponse } from "../services/lighthouse";

interface LighthouseStatusIndicatorProps {
  onClick?: () => void;
  variant?: "pill" | "badge" | "detailed";
  className?: string;
  autoRefreshIntervalMs?: number;
}

export const LighthouseStatusIndicator: React.FC<LighthouseStatusIndicatorProps> = ({
  onClick,
  variant = "pill",
  className = "",
  autoRefreshIntervalMs = 60000,
}) => {
  const [status, setStatus] = useState<LighthouseStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastCheck, setLastCheck] = useState<number>(Date.now());

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const res = await getLighthouseStatus();
      setStatus(res);
      setLastCheck(Date.now());
    } catch {
      setStatus({
        success: false,
        connected: false,
        dataLimit: 0,
        dataUsed: 0,
        totalFiles: 0,
        apiKeyMasked: "Error",
        isCustom: false,
        error: "Node unreachable",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    if (autoRefreshIntervalMs > 0) {
      const interval = setInterval(checkStatus, autoRefreshIntervalMs);
      return () => clearInterval(interval);
    }
  }, [autoRefreshIntervalMs]);

  const isConnected = status?.connected === true && status?.success === true;
  const isError = status && (!status.connected || !status.success);

  if (variant === "badge") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium transition cursor-pointer ${
          isConnected
            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
            : isError
            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100"
            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
        } ${className}`}
        title="Click to open Lighthouse IPFS diagnostics & storage settings"
      >
        <span className="relative flex h-2 w-2">
          {isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isConnected ? "bg-emerald-500" : isError ? "bg-rose-500" : "bg-slate-400"
            }`}
          />
        </span>
        <Server className="h-3 w-3" />
        <span>{isConnected ? "IPFS Node: Online" : isError ? "IPFS Node: Offline" : "Checking IPFS..."}</span>
      </button>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        onClick={onClick}
        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
          isConnected
            ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200"
            : isError
            ? "bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200"
            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
        } ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg ${
              isConnected
                ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400"
                : isError
                ? "bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400"
                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
            }`}
          >
            <Server className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">
                {isConnected ? "Lighthouse IPFS Node Connected" : isError ? "Lighthouse Node Disconnected" : "Checking Node Status"}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-white/80 dark:bg-slate-900/80 border border-current/20">
                {status?.isCustom ? "Custom Key" : ".env Key"}
              </span>
            </div>
            <p className="text-[10px] opacity-80 mt-0.5 font-mono">
              Key: {status?.apiKeyMasked || "Resolving..."} • Pinned Files: {status?.totalFiles ?? 0}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-[11px] underline opacity-90 hover:opacity-100">Test Diagnostics</span>
          <Activity className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-indigo-500" : ""}`} />
        </div>
      </div>
    );
  }

  // Default Pill Variant
  return (
    <button
      type="button"
      id="lighthouse-node-status-pill"
      onClick={onClick}
      className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition cursor-pointer ${
        isConnected
          ? "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          : isError
          ? "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
      } ${className}`}
      title="Lighthouse Decentralized IPFS Storage Node Status. Click for full diagnostics."
    >
      <span className="relative flex h-2 w-2">
        {isConnected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isConnected ? "bg-emerald-500" : isError ? "bg-rose-500" : "bg-amber-500"
          }`}
        />
      </span>
      <Server className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
      <span className="font-medium hidden md:inline">Lighthouse:</span>
      <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
        {isConnected ? "Online" : isError ? "Offline" : "Checking"}
      </span>
      <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">
        ({status?.totalFiles ?? 0} files)
      </span>
    </button>
  );
};
