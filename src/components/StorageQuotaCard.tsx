import React, { useState, useMemo, useEffect } from "react";
import {
  HardDrive,
  Database,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Server,
  Shield,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  File,
  Key,
  Settings,
} from "lucide-react";
import type { VaultDocument } from "../types";
import { getFileVisualConfig, type DetectedFileType } from "../utils/fileTypeHelper";
import { LighthouseStorageManagerModal } from "./LighthouseStorageManagerModal";
import { getLighthouseStatus, type LighthouseStatusResponse } from "../services/lighthouse";

interface StorageQuotaCardProps {
  documents: VaultDocument[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const DEFAULT_QUOTA_BYTES = 100 * 1024 * 1024; // 100 MB Free Lighthouse IPFS Tier

export function formatStorageBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 100 || i === 0 ? 0 : 2)} ${units[i]}`;
}

export const StorageQuotaCard: React.FC<StorageQuotaCardProps> = ({
  documents,
  onRefresh,
  isLoading = false,
}) => {
  // Allow user to select different quota tiers (e.g. 50 MB, 100 MB, 500 MB, 1 GB)
  const [selectedQuotaMB, setSelectedQuotaMB] = useState<number>(100);
  const [showTierDropdown, setShowTierDropdown] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showLighthouseModal, setShowLighthouseModal] = useState<boolean>(false);
  const [modalInitialTab, setModalInitialTab] = useState<"overview" | "files" | "apiKey" | "diagnostics">("overview");
  const [liveLighthouseStatus, setLiveLighthouseStatus] = useState<LighthouseStatusResponse | null>(null);

  // Load live lighthouse status
  const fetchLiveStatus = async () => {
    try {
      const res = await getLighthouseStatus();
      setLiveLighthouseStatus(res);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchLiveStatus();
  }, []);

  const quotaBytes = selectedQuotaMB * 1024 * 1024;

  // Calculate total used storage and categorize files
  const { totalUsedBytes, activeDocsCount, categoryBreakdown } = useMemo(() => {
    const active = documents.filter((d) => !d.deleted && !d.permanentlyDeleted);
    let totalBytes = 0;

    const breakdownMap: Record<
      DetectedFileType,
      { type: DetectedFileType; bytes: number; count: number; label: string; color: string }
    > = {
      pdf: { type: "pdf", bytes: 0, count: 0, label: "PDFs", color: "#f43f5e" },
      image: { type: "image", bytes: 0, count: 0, label: "Images", color: "#a855f7" },
      spreadsheet: { type: "spreadsheet", bytes: 0, count: 0, label: "Spreadsheets", color: "#10b981" },
      document: { type: "document", bytes: 0, count: 0, label: "Documents", color: "#2563eb" },
      code: { type: "code", bytes: 0, count: 0, label: "Code & Data", color: "#06b6d4" },
      archive: { type: "archive", bytes: 0, count: 0, label: "Archives", color: "#f59e0b" },
      audio: { type: "audio", bytes: 0, count: 0, label: "Audio", color: "#ec4899" },
      video: { type: "video", bytes: 0, count: 0, label: "Video", color: "#6366f1" },
      key: { type: "key", bytes: 0, count: 0, label: "Keys", color: "#64748b" },
      generic: { type: "generic", bytes: 0, count: 0, label: "Other", color: "#94a3b8" },
    };

    active.forEach((doc) => {
      // Use manifest size, fallback to 150KB if missing
      const size = doc.manifest?.size || 150 * 1024;
      totalBytes += size;

      const fileName = doc.manifest?.name || `doc_${doc.id}.pdf`;
      const config = getFileVisualConfig(fileName, doc.manifest?.mimeType);
      const cat = breakdownMap[config.type] || breakdownMap.generic;
      cat.bytes += size;
      cat.count += 1;
    });

    const activeCategories = Object.values(breakdownMap).filter((c) => c.count > 0);

    return {
      totalUsedBytes: totalBytes,
      activeDocsCount: active.length,
      categoryBreakdown: activeCategories,
    };
  }, [documents]);

  const usedPercentage = Math.min(100, Math.max(0, (totalUsedBytes / quotaBytes) * 100));
  const remainingBytes = Math.max(0, quotaBytes - totalUsedBytes);

  // Status severity
  const isDanger = usedPercentage >= 90;
  const isWarning = usedPercentage >= 75 && !isDanger;

  // Quota tier options
  const quotaOptions = [
    { mb: 50, label: "50 MB (Starter Sandbox)" },
    { mb: 100, label: "100 MB (Free IPFS Tier - Default)" },
    { mb: 250, label: "250 MB (Developer Quota)" },
    { mb: 500, label: "500 MB (Power User Tier)" },
    { mb: 1024, label: "1.0 GB (Decentralized Pro)" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 transition-colors">
      {/* Top Header: Title, Lighthouse IPFS Badge, Quota Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
              isDanger
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                : isWarning
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900"
            }`}
          >
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Lighthouse IPFS Storage</span>
              </h3>
              <button
                onClick={() => setShowLighthouseModal(true)}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900 transition cursor-pointer"
                title="Manage Lighthouse Node & API Keys"
              >
                <Server className="h-2.5 w-2.5" />
                <span>Node: Online</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Decentralized storage consumption for encrypted documents & Lit manifests
            </p>
          </div>
        </div>

        {/* Action controls: Lighthouse Diagnostics, Lighthouse Settings, Quota Tier Selector & Refresh */}
        <div className="flex items-center gap-2 relative flex-wrap sm:flex-nowrap">
          <button
            onClick={() => {
              setModalInitialTab("diagnostics");
              setShowLighthouseModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition cursor-pointer"
            title="Test Lighthouse IPFS Node Connectivity & Canary Upload"
          >
            <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">Test Node</span>
          </button>

          <button
            onClick={() => {
              setModalInitialTab("apiKey");
              setShowLighthouseModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition cursor-pointer"
            title="Lighthouse Node Settings & API Key"
          >
            <Key className="h-3 w-3" />
            <span className="font-medium">Lighthouse Key</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowTierDropdown(!showTierDropdown)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              title="Change Allotted Quota Tier"
            >
              <span className="text-slate-400 dark:text-slate-500 text-[11px]">Quota:</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono">
                {selectedQuotaMB >= 1024 ? "1.0 GB" : `${selectedQuotaMB} MB`}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showTierDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowTierDropdown(false)}
                />
                <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Allotted Quota Tier
                  </div>
                  {quotaOptions.map((opt) => (
                    <button
                      key={opt.mb}
                      onClick={() => {
                        setSelectedQuotaMB(opt.mb);
                        setShowTierDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 transition flex items-center justify-between cursor-pointer ${
                        selectedQuotaMB === opt.mb
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selectedQuotaMB === opt.mb && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {onRefresh && (
            <button
              onClick={() => {
                fetchLiveStatus();
                onRefresh();
              }}
              disabled={isLoading}
              className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Refresh Storage Status"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-indigo-500" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Metric Numbers */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              {formatStorageBytes(totalUsedBytes)}
            </span>
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
              / {formatStorageBytes(quotaBytes)}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatStorageBytes(remainingBytes)}
            </span>{" "}
            available ({Math.max(0, 100 - usedPercentage).toFixed(1)}% free) across{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {activeDocsCount}
            </span>{" "}
            encrypted {activeDocsCount === 1 ? "document" : "documents"}
          </p>
        </div>

        {/* Percentage Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 shadow-2xs ${
              isDanger
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                : isWarning
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
            }`}
          >
            {isDanger ? (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{usedPercentage.toFixed(1)}% Used</span>
          </div>
        </div>
      </div>

      {/* Visual Multi-Segment / Gradient Progress Bar */}
      <div className="mt-3.5 space-y-1.5">
        <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800/90 rounded-full p-0.5 overflow-hidden border border-slate-200/80 dark:border-slate-700/80 flex">
          {categoryBreakdown.length > 0 ? (
            categoryBreakdown.map((cat, idx) => {
              const segPct = (cat.bytes / quotaBytes) * 100;
              if (segPct <= 0) return null;
              return (
                <div
                  key={`quota-seg-${cat.type}-${idx}`}
                  style={{
                    width: `${segPct}%`,
                    backgroundColor: cat.color,
                  }}
                  className={`h-full transition-all duration-500 relative group cursor-pointer ${
                    idx === 0 ? "rounded-l-full" : ""
                  } ${idx === categoryBreakdown.length - 1 ? "rounded-r-full" : ""}`}
                  title={`${cat.label}: ${formatStorageBytes(cat.bytes)} (${(
                    (cat.bytes / totalUsedBytes) *
                    100
                  ).toFixed(1)}% of used)`}
                />
              );
            })
          ) : (
            <div
              style={{ width: `${Math.max(1, usedPercentage)}%` }}
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            />
          )}
        </div>

        {/* Quota ticks */}
        <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 px-0.5">
          <span>0 MB</span>
          <span>{formatStorageBytes(quotaBytes * 0.25)}</span>
          <span>{formatStorageBytes(quotaBytes * 0.5)}</span>
          <span>{formatStorageBytes(quotaBytes * 0.75)}</span>
          <span>{formatStorageBytes(quotaBytes)}</span>
        </div>
      </div>

      {/* Category Breakdown Badges */}
      {categoryBreakdown.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
            <Layers className="h-3 w-3" />
            <span>Usage Breakdown:</span>
          </span>

          {categoryBreakdown.map((cat, catIdx) => (
            <div
              key={`quota-breakdown-${cat.type}-${catIdx}`}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-mono shadow-2xs"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="font-sans font-medium text-slate-600 dark:text-slate-400">
                {cat.label}:
              </span>
              <span className="font-bold">{formatStorageBytes(cat.bytes)}</span>
              <span className="text-[10px] text-slate-400">
                ({((cat.bytes / Math.max(1, totalUsedBytes)) * 100).toFixed(0)}%)
              </span>
            </div>
          ))}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline ml-auto flex items-center gap-1 cursor-pointer font-medium"
          >
            <Info className="h-3 w-3" />
            <span>{showDetails ? "Hide Details" : "Lighthouse Specs"}</span>
          </button>
        </div>
      )}

      {/* Collapsible Lighthouse Specs / Details */}
      {showDetails && (
        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Decentralized Lighthouse IPFS & Filecoin Guarantees</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
              Active Storage Deals
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] pt-1">
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block">Encryption Pipeline</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Client AES-GCM-256
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Ciphertext never leaves browser unencrypted
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block">Decentralized Pinned Nodes</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                IPFS Cluster + Filecoin
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Persistent storage deals with verifiable CIDs
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block">Lit Protocol Conditions</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                EVM Sepolia Smart Contract
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Keys decrypted only if wallet passes ownership check
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Near-Limit Warning Alert */}
      {isDanger && (
        <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>
            Storage limit reached {usedPercentage.toFixed(1)}%! Please remove unused documents or
            switch to a higher storage quota tier to ensure reliable IPFS uploads.
          </span>
        </div>
      )}

      {/* Lighthouse Node Storage Manager Modal */}
      <LighthouseStorageManagerModal
        isOpen={showLighthouseModal}
        initialTab={modalInitialTab}
        onClose={() => setShowLighthouseModal(false)}
        onKeyUpdated={() => {
          fetchLiveStatus();
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
