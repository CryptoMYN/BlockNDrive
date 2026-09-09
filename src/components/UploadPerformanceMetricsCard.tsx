import React, { useState } from "react";
import {
  Zap,
  Clock,
  HardDrive,
  Cpu,
  Database,
  Lock,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Activity,
  Wifi,
  Sparkles,
  Info,
} from "lucide-react";
import type { UploadPerformanceMetrics, PerformanceStepMetric } from "../types";
import { formatBytes, formatDuration } from "../services/performanceTracker";

interface UploadPerformanceMetricsCardProps {
  metrics: UploadPerformanceMetrics;
  fileName?: string;
  isLive?: boolean;
  activeStepId?: string;
  onCopyReport?: () => void;
}

export const UploadPerformanceMetricsCard: React.FC<UploadPerformanceMetricsCardProps> = ({
  metrics,
  fileName,
  isLive = false,
  activeStepId,
  onCopyReport,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    if (onCopyReport) {
      onCopyReport();
    } else {
      navigator.clipboard.writeText(JSON.stringify(metrics, null, 2));
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getCategoryIcon = (category: PerformanceStepMetric["category"]) => {
    switch (category) {
      case "crypto":
        return Lock;
      case "ai":
        return Cpu;
      case "storage":
        return Database;
      case "access_control":
        return Sparkles;
      case "blockchain":
        return LinkIcon;
      default:
        return Activity;
    }
  };

  const getNetworkBadgeStyle = (grade: UploadPerformanceMetrics["networkGrade"]) => {
    switch (grade) {
      case "ultra_fast":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200",
          dot: "bg-emerald-500",
          iconColor: "text-emerald-600 dark:text-emerald-400",
        };
      case "fast":
        return {
          bg: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200",
          dot: "bg-indigo-500",
          iconColor: "text-indigo-600 dark:text-indigo-400",
        };
      case "moderate":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
          dot: "bg-blue-500",
          iconColor: "text-blue-600 dark:text-blue-400",
        };
      case "slow":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
          dot: "bg-amber-500",
          iconColor: "text-amber-600 dark:text-amber-400",
        };
      case "very_slow":
      default:
        return {
          bg: "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200",
          dot: "bg-rose-500",
          iconColor: "text-rose-600 dark:text-rose-400",
        };
    }
  };

  const netStyle = getNetworkBadgeStyle(metrics.networkGrade);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all text-xs">
      {/* Card Header */}
      <div className="p-3 sm:p-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Operation Timing & Network Metrics
              </span>
              {isLive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-semibold animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
                  Live Measuring
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Granular cryptographic encryption benchmarks & decentralized IPFS transfer telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Copy formatted benchmark report"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy Logs</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
            title={isExpanded ? "Collapse timing metrics" : "Expand timing metrics"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main KPI Summary Strip */}
      <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
        {/* Total Time */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-400 text-[11px] font-medium">
            <Clock className="h-3 w-3 text-indigo-500" />
            <span>Total Duration</span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
            {formatDuration(metrics.totalDurationMs)}
          </p>
        </div>

        {/* Local AES Encryption Throughput */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-400 text-[11px] font-medium">
            <Lock className="h-3 w-3 text-emerald-500" />
            <span>AES-256 Speed</span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
            {metrics.encryptionThroughputFormatted}
          </p>
        </div>

        {/* IPFS Upload Throughput */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-400 text-[11px] font-medium">
            <Database className="h-3 w-3 text-blue-500" />
            <span>IPFS Transfer</span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
            {metrics.ipfsThroughputFormatted}
          </p>
        </div>

        {/* Network Speed Classification */}
        <div className={`p-2.5 rounded-lg border ${netStyle.bg}`}>
          <div className="flex items-center gap-1 text-[11px] font-medium opacity-90">
            <Wifi className={`h-3 w-3 ${netStyle.iconColor}`} />
            <span>Network Rating</span>
          </div>
          <p className="text-xs font-bold truncate mt-0.5 font-mono">
            {metrics.networkGradeLabel.split(" ")[0]} {metrics.networkGrade.toUpperCase()}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-4">
          {/* Network Speed Advice Banner */}
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${netStyle.bg}`}>
            <Info className={`h-4 w-4 mt-0.5 shrink-0 ${netStyle.iconColor}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold">{metrics.networkGradeLabel}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/60 dark:bg-black/30 border border-black/5 dark:border-white/10">
                  {formatBytes(metrics.fileSizeBytes)} Payload
                </span>
              </div>
              <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                {metrics.networkAdvice}
              </p>
            </div>
          </div>

          {/* Granular Step-by-Step Waterfall Log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
                Granular Stage Telemetry
              </span>
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {showRawJson ? "Show Waterfall View" : "View Raw JSON Data"}
              </button>
            </div>

            {showRawJson ? (
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[10px] font-mono leading-tight max-h-60">
                {JSON.stringify(metrics, null, 2)}
              </pre>
            ) : (
              <div className="space-y-2">
                {metrics.steps.map((step) => {
                  const StepIcon = getCategoryIcon(step.category);
                  const isCurrent = activeStepId === step.id;
                  const ratio =
                    metrics.totalDurationMs > 0
                      ? Math.min(100, Math.max(3, (step.durationMs / metrics.totalDurationMs) * 100))
                      : 0;

                  return (
                    <div
                      key={step.id}
                      className={`p-2.5 rounded-lg border transition-all ${
                        isCurrent
                          ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-2xs"
                          : step.status === "completed"
                          ? "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80"
                          : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`p-1 rounded-md shrink-0 ${
                              step.status === "completed"
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                                : isCurrent
                                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 animate-pulse"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            }`}
                          >
                            <StepIcon className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {step.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono shrink-0">
                          {step.throughputFormatted && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                              {step.throughputFormatted}
                            </span>
                          )}
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatDuration(step.durationMs)}
                          </span>
                        </div>
                      </div>

                      {/* Waterfall Progress Bar */}
                      <div className="mt-1.5 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCurrent
                              ? "bg-indigo-500 animate-pulse"
                              : step.category === "crypto"
                              ? "bg-emerald-500"
                              : step.category === "storage"
                              ? "bg-blue-500"
                              : step.category === "ai"
                              ? "bg-purple-500"
                              : step.category === "blockchain"
                              ? "bg-amber-500"
                              : "bg-slate-500"
                          }`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>

                      {step.details && (
                        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {step.details}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default UploadPerformanceMetricsCard;
