import React, { useState, useEffect } from "react";
import {
  Server,
  Key,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  Copy,
  Check,
  FileText,
  X,
  Sparkles,
  Link2,
  Activity,
  Zap,
  Clock,
  Terminal,
  FileCode,
} from "lucide-react";
import {
  getLighthouseStatus,
  getLighthouseUploads,
  verifyLighthouseApiKey,
  runLighthouseDiagnostics,
  getStoredLighthouseApiKey,
  setStoredLighthouseApiKey,
  type LighthouseStatusResponse,
  type LighthouseUploadedFile,
  type LighthouseDiagnosticReport,
} from "../services/lighthouse";
import { formatStorageBytes } from "./StorageQuotaCard";

interface LighthouseStorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
  initialTab?: "overview" | "files" | "apiKey" | "diagnostics";
}

export const LighthouseStorageManagerModal: React.FC<LighthouseStorageManagerModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
  initialTab = "overview",
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [status, setStatus] = useState<LighthouseStatusResponse | null>(null);
  const [uploads, setUploads] = useState<LighthouseUploadedFile[]>([]);
  const [diagnosticReport, setDiagnosticReport] = useState<LighthouseDiagnosticReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "files" | "apiKey" | "diagnostics">(initialTab);
  const [copiedCid, setCopiedCid] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Fetch status and uploads when modal opens
  const refreshLighthouseData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [statusRes, uploadsRes] = await Promise.allSettled([
        getLighthouseStatus(),
        getLighthouseUploads(),
      ]);

      if (statusRes.status === "fulfilled") {
        setStatus(statusRes.value);
      } else {
        setErrorMsg(statusRes.reason?.message || "Failed to query Lighthouse account status");
      }

      if (uploadsRes.status === "fulfilled") {
        setUploads(uploadsRes.value.fileList || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect to Lighthouse");
    } finally {
      setIsLoading(false);
    }
  };

  // Run full diagnostic utility
  const handleRunDiagnostics = async () => {
    setIsDiagnosing(true);
    setErrorMsg(null);
    try {
      const report = await runLighthouseDiagnostics();
      setDiagnosticReport(report);
      if (report.overallStatus === "healthy") {
        setSuccessMsg("All 5 decentralized storage diagnostic tests passed successfully!");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Diagnostic test encountered an error");
    } finally {
      setIsDiagnosing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const savedKey = getStoredLighthouseApiKey();
      setApiKeyInput(savedKey || "");
      setActiveTab(initialTab);
      refreshLighthouseData();
      if (initialTab === "diagnostics") {
        handleRunDiagnostics();
      }
    }
  }, [isOpen, initialTab]);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      // Revert to system default
      setStoredLighthouseApiKey(null);
      setSuccessMsg("Reverted to default project Lighthouse storage key.");
      setIsVerifying(false);
      await refreshLighthouseData();
      if (onKeyUpdated) onKeyUpdated();
      return;
    }

    try {
      const verifyRes = await verifyLighthouseApiKey(trimmed);
      if (verifyRes.valid) {
        setStoredLighthouseApiKey(trimmed);
        setSuccessMsg("Lighthouse API Key verified and saved successfully!");
        await refreshLighthouseData();
        if (onKeyUpdated) onKeyUpdated();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid Lighthouse API Key. Please check the key.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyCid = (cid: string) => {
    navigator.clipboard.writeText(cid);
    setCopiedCid(cid);
    setTimeout(() => setCopiedCid(null), 2000);
  };

  const handleCopyReportJson = () => {
    if (!diagnosticReport) return;
    navigator.clipboard.writeText(JSON.stringify(diagnosticReport, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl border border-white/20">
              <Server className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Lighthouse Storage Integration</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-white/20 text-white font-semibold">
                  Filecoin + IPFS
                </span>
              </h2>
              <p className="text-xs text-blue-100">
                Decentralized permanent storage nodes & API key manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <HardDrive className="h-4 w-4" />
            <span>Account & Quota</span>
          </button>

          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "diagnostics"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Diagnostics & Tests</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab("files")}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "files"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <Database className="h-4 w-4" />
            <span>Uploaded Files ({uploads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("apiKey")}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "apiKey"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <Key className="h-4 w-4" />
            <span>Configure Key</span>
          </button>

          <button
            onClick={refreshLighthouseData}
            disabled={isLoading}
            className="ml-auto p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            title="Refresh Lighthouse Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-indigo-500" : ""}`} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Connection Status Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Lighthouse Storage Node Connected
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {status?.isCustom ? "Custom Key Active" : "Default Project Key"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Active Key: <code className="font-mono">{status?.apiKeyMasked || "Configured"}</code>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setActiveTab("diagnostics");
                      handleRunDiagnostics();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Activity className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Run Diagnostics</span>
                  </button>

                  <a
                    href="https://files.lighthouse.storage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Lighthouse Dapp</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Storage Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-medium text-slate-400">Data Used on Node</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                    {formatStorageBytes(status?.dataUsed || 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">Queried live from Lighthouse</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-medium text-slate-400">Total Storage Limit</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                    {formatStorageBytes(status?.dataLimit || 5368709120)}
                  </div>
                  <p className="text-[10px] text-slate-400">Free Tier (5.0 GB default)</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-medium text-slate-400">Total Pinned Files</span>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {status?.totalFiles || uploads.length} files
                  </div>
                  <p className="text-[10px] text-slate-400">Filecoin deal replicated</p>
                </div>
              </div>

              {/* How it works info */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-2">
                <h4 className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>How BlockNDrive Stores Data in Lighthouse</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-800 dark:text-blue-300">
                  <li>
                    <strong>Client-Side Encryption:</strong> Documents are encrypted with AES-256-GCM in your browser before upload.
                  </li>
                  <li>
                    <strong>IPFS & Filecoin Replication:</strong> Encrypted blobs and Lit metadata manifests are uploaded via the official <code className="font-mono">@lighthouse-web3/sdk</code> to Lighthouse storage nodes.
                  </li>
                  <li>
                    <strong>On-Chain EVM Anchoring:</strong> The IPFS CID is registered on the Sepolia smart contract, binding ownership to your Web3 wallet.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: Diagnostics & Connectivity Testing */}
          {activeTab === "diagnostics" && (
            <div className="space-y-4">
              {/* Diagnostic Control Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Lighthouse IPFS Connectivity Diagnostic
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Tests environment API keys, node authentication, storage deals, live canary upload, and IPFS gateway reachability.
                  </p>
                </div>

                <button
                  onClick={handleRunDiagnostics}
                  disabled={isDiagnosing}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Activity className={`h-4 w-4 ${isDiagnosing ? "animate-spin" : ""}`} />
                  <span>{isDiagnosing ? "Running Diagnostics..." : "Run Connectivity Test"}</span>
                </button>
              </div>

              {/* Diagnostic Results */}
              {diagnosticReport ? (
                <div className="space-y-3">
                  {/* Overall Status summary pill */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          diagnosticReport.overallStatus === "healthy"
                            ? "bg-emerald-500"
                            : diagnosticReport.overallStatus === "degraded"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      />
                      <span className="font-bold text-slate-900 dark:text-white">
                        Diagnostic Result:{" "}
                        <span
                          className={
                            diagnosticReport.overallStatus === "healthy"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : diagnosticReport.overallStatus === "degraded"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {diagnosticReport.overallStatus.toUpperCase()}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{diagnosticReport.totalDurationMs}ms</span>
                      </span>
                      <span>Key: {diagnosticReport.keySource}</span>
                    </div>
                  </div>

                  {/* 5 Step Trace */}
                  <div className="space-y-2">
                    {diagnosticReport.steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs"
                      >
                        <div className="mt-0.5 shrink-0">
                          {step.status === "success" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : step.status === "warning" ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              Step {idx + 1}: {step.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {step.durationMs}ms
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            {step.details}
                          </p>

                          {step.data?.gatewayUrl && (
                            <div className="pt-1 flex items-center gap-2">
                              <a
                                href={step.data.gatewayUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                <span>Inspect Canary IPFS Gateway</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Copy Diagnostic Log */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={handleCopyReportJson}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 hover:bg-slate-50 transition cursor-pointer"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Copied Log JSON</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Diagnostic JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Activity className="h-8 w-8 text-indigo-500 mx-auto animate-pulse" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Diagnostic utility ready to test Lighthouse IPFS connectivity
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Click "Run Connectivity Test" above to verify the API key, authenticate with storage nodes, perform a live test upload, and verify IPFS gateway delivery.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Uploaded Files */}
          {activeTab === "files" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Files registered under active Lighthouse API key</span>
                <span className="font-mono font-semibold">{uploads.length} items</span>
              </div>

              {uploads.length === 0 ? (
                <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Database className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    No files found under this Lighthouse key yet
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Upload documents through the vault upload box to sync them to Lighthouse IPFS.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  {uploads.map((file, idx) => (
                    <div
                      key={file.id || file.cid || idx}
                      className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {file.fileName || "Encrypted Document"}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>CID: {file.cid?.slice(0, 8)}...{file.cid?.slice(-6)}</span>
                            <span>•</span>
                            <span>{formatStorageBytes(file.fileSizeInBytes || 0)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleCopyCid(file.cid)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Copy IPFS CID"
                        >
                          {copiedCid === file.cid ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <a
                          href={`https://gateway.lighthouse.storage/ipfs/${file.cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                          title="View on Lighthouse IPFS Gateway"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Configure API Key */}
          {activeTab === "apiKey" && (
            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Your Lighthouse API Key</span>
                  <a
                    href="https://files.lighthouse.storage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-normal"
                  >
                    <span>Get Key from files.lighthouse.storage</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </label>
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="e.g. 36fb9eb8.a41cb0cdda914ca7ac0e7e0f07df3e57"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400">
                  Leave empty to reset to the default shared project storage key.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setApiKeyInput("");
                    setStoredLighthouseApiKey(null);
                    setSuccessMsg("Reset to default project Lighthouse key.");
                    refreshLighthouseData();
                    if (onKeyUpdated) onKeyUpdated();
                  }}
                  className="px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Reset to Default
                </button>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Verifying with Lighthouse...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Verify & Save Key</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Server className="h-3.5 w-3.5 text-indigo-600" />
            <span>Node: <code className="font-mono text-slate-700 dark:text-slate-300">node.lighthouse.storage</code></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
