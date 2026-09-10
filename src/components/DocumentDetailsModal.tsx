import React, { useState } from "react";
import {
  X,
  FileText,
  Lock,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Database,
  Key,
  Copy,
  CheckCircle2,
  Download,
  Loader2,
  Share2,
  Mail,
  Link as LinkIcon,
  Shield,
  Sparkles,
  Activity,
  Send,
  Clock,
} from "lucide-react";
import type { VaultDocument, WalletState } from "../types";
import { HIGH_RISK_THRESHOLD } from "../constants/contract";
import {
  generateLitShareableLink,
  type LitSignedAccessPayload,
} from "../services/crypto";
import { getFileVisualConfig } from "../utils/fileTypeHelper";
import { LitShareModal } from "./LitShareModal";
import { EncryptedSecurityBadge } from "./EncryptedSecurityBadge";
import { DocumentActivityLogTab } from "./DocumentActivityLogTab";
import { UploadPerformanceMetricsCard } from "./UploadPerformanceMetricsCard";

interface DocumentDetailsModalProps {
  document: VaultDocument | null;
  wallet: WalletState;
  onClose: () => void;
  onDownload: (doc: VaultDocument) => void;
  onOpenCREModal?: () => void;
}

export const DocumentDetailsModal: React.FC<DocumentDetailsModalProps> = ({
  document,
  wallet,
  onClose,
  onDownload,
  onOpenCREModal,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "activity">("details");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [generatedLinkUrl, setGeneratedLinkUrl] = useState<string | null>(null);
  const [sharePayload, setSharePayload] = useState<LitSignedAccessPayload | null>(null);

  if (!document) return null;

  const isHighRisk = document.riskScore >= HIGH_RISK_THRESHOLD;
  const fileName = document.manifest?.name || `document_${document.id}.pdf`;
  const manifest = document.manifest;
  const fileVisual = getFileVisualConfig(fileName, manifest?.mimeType);
  const FileVisualIcon = fileVisual.Icon;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(label);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleCopyShareableLink = () => {
    const ownerAddr =
      document.owner ||
      wallet.address ||
      "0x0000000000000000000000000000000000000000";
    const { url, payload } = generateLitShareableLink(document, ownerAddr, 7);
    navigator.clipboard.writeText(url);
    setGeneratedLinkUrl(url);
    setSharePayload(payload);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 3500);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "--";
    return new Date(timestamp).toLocaleString("en-US");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto transition-colors">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 my-8 animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${fileVisual.bgClass} ${fileVisual.textClass} border ${fileVisual.borderClass} relative flex items-center justify-center`}>
              <FileVisualIcon className="h-6 w-6" />
              <span className="absolute -bottom-1 -right-1 bg-slate-900/90 dark:bg-slate-950 text-white text-[8px] font-mono font-bold px-1 py-0.2 rounded shadow-xs leading-tight tracking-wider border border-white/15">
                {fileVisual.extension}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${fileVisual.badgeClass}`}>
                  <FileVisualIcon className="h-3 w-3" />
                  <span>{fileVisual.extension}</span>
                </span>
                <EncryptedSecurityBadge
                  fileName={fileName}
                  fileSize={document.manifest?.size}
                  ownerAddress={document.owner || wallet.address}
                  variant="badge"
                />
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono truncate max-w-md">
                  {fileName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                On-Chain Contract Record #{document.id} • {fileVisual.label} • Sepolia Registry
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              id="modal-header-share-btn"
              onClick={() => setShowShareModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200/80 dark:border-indigo-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Share secure time-limited access link via email or Lit Protocol"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
            <button
              id="modal-header-copy-share-btn"
              onClick={handleCopyShareableLink}
              className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 border border-transparent hover:border-indigo-100 dark:hover:border-slate-700 transition flex items-center gap-1 cursor-pointer"
              title="Quick Copy Signed Lit Shareable Link"
            >
              {copiedShareLink ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <button
            type="button"
            id="doc-modal-tab-details"
            onClick={() => setActiveTab("details")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "details"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
            <span>Overview & Security</span>
          </button>

          <button
            type="button"
            id="doc-modal-tab-activity"
            onClick={() => setActiveTab("activity")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "activity"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            <span>Document Activity Log</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
              Audit
            </span>
          </button>
        </div>

        {/* Modal Body */}
        {activeTab === "activity" ? (
          <div className="mt-4 text-xs">
            <DocumentActivityLogTab
              document={document}
              wallet={wallet}
              onOpenShareModal={() => setShowShareModal(true)}
            />
          </div>
        ) : (
          <div className="mt-5 space-y-5 text-xs">
          {/* Risk Alert Banner if High Risk */}
          {isHighRisk && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-3.5 flex items-start gap-2.5 text-rose-800 dark:text-rose-200">
              <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Chainlink CRE High Risk Alert (Score: {document.riskScore}/100)</p>
                <p className="mt-0.5 text-rose-700 dark:text-rose-300">
                  {manifest?.aiAnalysis.reasoning ||
                    "This document exceeded the high-risk threshold (>= 80) due to sensitive detected keys, credentials, or personal identification records."}
                </p>
              </div>
            </div>
          )}

          {/* Core Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 dark:text-slate-400 font-medium block">File Format</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 inline-flex items-center gap-1">
                <FileVisualIcon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span className="truncate font-mono">{fileVisual.extension}</span>
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 dark:text-slate-400 font-medium block">Risk Score</span>
              <span
                className={`text-sm font-bold mt-1 inline-block ${
                  isHighRisk
                    ? "text-rose-600 dark:text-rose-400"
                    : document.riskScore >= 50
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {document.riskScore} / 100
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 dark:text-slate-400 font-medium block">Encryption</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 inline-block">
                AES-GCM 256
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 dark:text-slate-400 font-medium block">Storage</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 inline-block">
                Lighthouse IPFS
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 dark:text-slate-400 font-medium block">Access Rule</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 inline-block">
                Lit Owner-Only
              </span>
            </div>
          </div>

          {/* Chainlink CRE AI Analysis Breakdown */}
          {manifest?.aiAnalysis && (
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <Cpu className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Chainlink CRE Report & AI Metadata</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    CRE DON Verified
                  </span>
                  {onOpenCREModal && (
                    <button
                      onClick={onOpenCREModal}
                      className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-[10px] font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <Activity className="h-3 w-3" />
                      <span>View D3 Trends</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="text-slate-600 dark:text-slate-300 space-y-1 pt-1">
                <p>
                  <strong className="text-slate-700 dark:text-slate-200">Classification:</strong>{" "}
                  {manifest.aiAnalysis.classification} ({manifest.aiAnalysis.category})
                </p>
                <p>
                  <strong className="text-slate-700 dark:text-slate-200">AI Summary:</strong>{" "}
                  {manifest.aiAnalysis.summary}
                </p>
                {manifest.aiAnalysis.reasoning && (
                  <p>
                    <strong className="text-slate-700 dark:text-slate-200">Risk Assessment:</strong>{" "}
                    {manifest.aiAnalysis.reasoning}
                  </p>
                )}
                {manifest.aiAnalysis.detectedEntities && manifest.aiAnalysis.detectedEntities.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <strong className="text-slate-700 dark:text-slate-200">Entities:</strong>
                    {manifest.aiAnalysis.detectedEntities.map((ent, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] text-slate-600 dark:text-slate-300"
                      >
                        {ent}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hashes and CIDs */}
          <div className="space-y-3 font-mono">
            {/* Manifest CID */}
            <div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 font-sans">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Manifest CID (IPFS)</span>
                <a
                  href={`https://gateway.lighthouse.storage/ipfs/${document.manifestCID}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Gateway</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-800 dark:text-slate-200 break-all select-all">
                  {document.manifestCID}
                </span>
                <button
                  onClick={() => copyToClipboard(document.manifestCID, "cid")}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                >
                  {copiedHash === "cid" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* File Hash (bytes32) */}
            <div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 font-sans">
                <span className="font-semibold text-slate-700 dark:text-slate-300">File Hash (bytes32 keccak256)</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Stored on Smart Contract</span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-800 dark:text-slate-200 break-all select-all">
                  {document.fileHash}
                </span>
                <button
                  onClick={() => copyToClipboard(document.fileHash, "fileHash")}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                >
                  {copiedHash === "fileHash" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Manifest Hash (bytes32) */}
            <div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 font-sans">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Manifest Hash (bytes32)</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Stored on Smart Contract</span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-800 dark:text-slate-200 break-all select-all">
                  {document.manifestHash}
                </span>
                <button
                  onClick={() => copyToClipboard(document.manifestHash, "manifestHash")}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                >
                  {copiedHash === "manifestHash" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Document Owner */}
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300 font-sans block mb-1">
                Owner Address
              </span>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-800 dark:text-slate-200 break-all select-all">
                  {document.owner}
                </span>
                <button
                  onClick={() => copyToClipboard(document.owner, "owner")}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                >
                  {copiedHash === "owner" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Lit Protocol Access Control & Signed Share Link Card */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    Lit Protocol Access Control
                    <span className="px-1.5 py-0.2 bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] rounded-full font-medium">
                      EVM Condition
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Decentralized encryption key delegation validated by Sepolia smart contract
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  id="modal-body-open-share-btn"
                  onClick={() => setShowShareModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share via Email</span>
                </button>

                <button
                  id="modal-body-copy-share-btn"
                  onClick={handleCopyShareableLink}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-indigo-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Quick Copy Share Link"
                >
                  {copiedShareLink ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-lg border border-indigo-100/80 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-400 font-sans">Condition:</span>
                <span className="text-indigo-800 dark:text-indigo-300 font-semibold truncate max-w-[280px]">
                  Sepolia: ownerOf({document.id}) == {document.owner.slice(0, 8)}...
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-400 font-sans">Grant Validity:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-sans font-medium">
                  Customizable Time-Limited Signed Attestation
                </span>
              </div>
            </div>

            {copiedShareLink && (
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in duration-200 font-sans">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Signed Lit Protocol share link copied to clipboard! Anyone with this link can inspect and verify cryptographic permissions.
                </span>
              </div>
            )}
          </div>

          {/* Upload Performance & Network Benchmark Telemetry */}
          {manifest?.metadata?.performanceMetrics && (
            <div className="pt-1">
              <UploadPerformanceMetricsCard
                metrics={manifest.metadata.performanceMetrics}
                fileName={manifest?.name || manifest?.metadata?.originalName}
              />
            </div>
          )}
        </div>
        )}

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Created: {formatDate(document.createdAt)}
          </span>

          <div className="flex items-center gap-2">
            <button
              id="share-modal-footer-btn"
              onClick={() => setShowShareModal(true)}
              className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              title="Open Lit Protocol Share options to generate time-limited link or share via email"
            >
              <Share2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Share</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={() => onDownload(document)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Decrypt & Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lit Protocol Dedicated Share Dialog */}
      {showShareModal && (
        <LitShareModal
          document={document}
          wallet={wallet}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};
