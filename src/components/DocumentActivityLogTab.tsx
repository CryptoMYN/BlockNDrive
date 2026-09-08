import React, { useState, useEffect } from "react";
import {
  Activity,
  ShieldCheck,
  Lock,
  Cpu,
  Layers,
  Share2,
  Download,
  Clock,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Filter,
  FileText,
  AlertCircle,
  Key,
  Database,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
  Shield,
  Copy,
} from "lucide-react";
import type { VaultDocument, DocumentAuditLog, AuditActionType, WalletState } from "../types";
import {
  getDocumentAuditLogs,
  seedInitialAuditLogsIfEmpty,
  logDocumentActivity,
  auth,
} from "../lib/firebase";

interface DocumentActivityLogTabProps {
  document: VaultDocument;
  wallet: WalletState;
  onOpenShareModal?: () => void;
}

const ACTION_CONFIG: Record<
  AuditActionType,
  {
    label: string;
    Icon: React.ElementType;
    badgeBg: string;
    badgeText: string;
    border: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  upload: {
    label: "File Upload",
    Icon: FileText,
    badgeBg: "bg-blue-50 dark:bg-blue-950/60",
    badgeText: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900/60",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  encryption: {
    label: "AES-256 Encryption",
    Icon: Lock,
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/60",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  metadata_analysis: {
    label: "Chainlink CRE & AI",
    Icon: Cpu,
    badgeBg: "bg-indigo-50 dark:bg-indigo-950/60",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/60",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  blockchain_registry: {
    label: "Sepolia Blockchain",
    Icon: Layers,
    badgeBg: "bg-purple-50 dark:bg-purple-950/60",
    badgeText: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    iconBg: "bg-purple-100 dark:bg-purple-900/60",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  lit_access_seal: {
    label: "Lit Key Sealing",
    Icon: ShieldCheck,
    badgeBg: "bg-violet-50 dark:bg-violet-950/60",
    badgeText: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-800",
    iconBg: "bg-violet-100 dark:bg-violet-900/60",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  access_grant: {
    label: "Access Grant",
    Icon: Share2,
    badgeBg: "bg-teal-50 dark:bg-teal-950/60",
    badgeText: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
    iconBg: "bg-teal-100 dark:bg-teal-900/60",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  download_decryption: {
    label: "Decrypt & Download",
    Icon: Download,
    badgeBg: "bg-cyan-50 dark:bg-cyan-950/60",
    badgeText: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/60",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  archive: {
    label: "Archived",
    Icon: Clock,
    badgeBg: "bg-amber-50 dark:bg-amber-950/60",
    badgeText: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-amber-100 dark:bg-amber-900/60",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  restore: {
    label: "Restored",
    Icon: RefreshCw,
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/60",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
};

export const DocumentActivityLogTab: React.FC<DocumentActivityLogTabProps> = ({
  document,
  wallet,
  onOpenShareModal,
}) => {
  const [logs, setLogs] = useState<DocumentAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      // Fetch or seed baseline audit logs
      const fetched = await seedInitialAuditLogsIfEmpty(document, auth.currentUser?.uid);
      setLogs(fetched);
    } catch (err) {
      console.warn("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, [document.id, document.fileHash]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction === "ALL") return true;
    if (filterAction === "SECURITY")
      return ["encryption", "lit_access_seal", "download_decryption"].includes(log.action);
    if (filterAction === "AI_CHAINLINK")
      return ["metadata_analysis", "blockchain_registry"].includes(log.action);
    if (filterAction === "ACCESS")
      return ["access_grant", "download_decryption"].includes(log.action);
    return log.action === filterAction;
  });

  const formatTimestamp = (tsMs: number | string): { full: string; relative: string } => {
    const num = typeof tsMs === "string" ? new Date(tsMs).getTime() : tsMs;
    if (!num || isNaN(num)) {
      return { full: "--", relative: "--" };
    }
    const date = new Date(num);
    return {
      full: date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      relative: getRelativeTime(num),
    };
  };

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diffSec = Math.floor((now - timestamp) / 1000);
    if (diffSec < 10) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Firestore Cryptographic Audit Trail</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Immutable
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {logs.length} verifiable operations recorded on decentralized vault storage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Select */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="h-3 w-3 text-slate-400" />
            <select
              id="activity-log-filter"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Events ({logs.length})</option>
              <option value="SECURITY">Security & Cryptography</option>
              <option value="AI_CHAINLINK">AI & Blockchain</option>
              <option value="ACCESS">Access & Sharing</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            id="activity-log-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Refresh Firestore Audit Logs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-indigo-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Timeline List */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
          <p className="text-xs font-medium">Fetching verified audit trail from Firestore...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-10 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <Clock className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No matching activity records found</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Adjust your filter to view other cryptographic events.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {filteredLogs.map((log, index) => {
            const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.upload;
            const Icon = config.Icon;
            const time = formatTimestamp(log.timestampMs);
            const isExpanded = expandedLogIds[log.id];

            return (
              <div
                key={log.id}
                id={`audit-log-item-${log.id}`}
                className="relative bg-white dark:bg-slate-800/90 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition"
              >
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 top-3.5 h-5 w-5 rounded-full ${config.iconBg} ${config.iconColor} border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs`}
                >
                  <Icon className="h-2.5 w-2.5 stroke-[2.5]" />
                </div>

                {/* Log Item Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.badgeBg} ${config.badgeText} border ${config.border}`}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{config.label}</span>
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      {log.title}
                    </h5>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                      {time.relative}
                    </span>
                    <span className="hidden sm:inline-block">•</span>
                    <span className="hidden sm:inline-block text-[10px]">{time.full}</span>
                  </div>
                </div>

                {/* Log Description */}
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {log.description}
                </p>

                {/* Actor info & Metadata trigger */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                    <User className="h-3 w-3 text-slate-400" />
                    <span>Actor: {log.actor}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleExpand(log.id)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer text-[10px]"
                  >
                    <span>{isExpanded ? "Hide Technical Details" : "View Cryptographic Details"}</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>

                {/* Expandable Technical Metadata */}
                {isExpanded && log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-slate-500 font-sans font-semibold border-b border-slate-200 dark:border-slate-800 pb-1">
                      <span>Audit Record Metadata</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(JSON.stringify(log.metadata, null, 2), log.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === log.id ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>{copiedId === log.id ? "Copied" : "Copy JSON"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1 text-slate-700 dark:text-slate-300">
                      {Object.entries(log.metadata).map(([key, val]) => (
                        <div key={key} className="flex items-start justify-between gap-2 overflow-hidden">
                          <span className="text-slate-400 shrink-0">{key}:</span>
                          <span className="truncate text-right text-indigo-700 dark:text-indigo-300">
                            {typeof val === "object" ? JSON.stringify(val) : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Action Footer in Activity Tab */}
      <div className="bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
          <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>Every access grant or decrypt request automatically writes a new immutable audit record to Firestore.</span>
        </div>
        {onOpenShareModal && (
          <button
            type="button"
            onClick={onOpenShareModal}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-[11px] shadow-2xs transition flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Share2 className="h-3 w-3" />
            <span>New Grant</span>
          </button>
        )}
      </div>
    </div>
  );
};
