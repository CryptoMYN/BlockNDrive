import React, { useState, useEffect } from "react";
import {
  X,
  Share2,
  Mail,
  Clock,
  Copy,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Lock,
  Sparkles,
  Send,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  QrCode,
  Globe,
} from "lucide-react";
import type { VaultDocument, WalletState } from "../types";
import {
  generateLitShareableLink,
  generateLitEmailShareContent,
  formatLitTimeRemaining,
  type LitSignedAccessPayload,
} from "../services/crypto";
import { getFileVisualConfig } from "../utils/fileTypeHelper";
import { logDocumentActivity } from "../lib/firebase";

interface LitShareModalProps {
  document: VaultDocument | null;
  wallet: WalletState;
  onClose: () => void;
}

const DURATION_PRESETS = [
  { label: "1 Hour", hours: 1, tag: "Quick" },
  { label: "6 Hours", hours: 6, tag: "Temporary" },
  { label: "24 Hours (1 Day)", hours: 24, tag: "Standard" },
  { label: "3 Days", hours: 72, tag: "Extended" },
  { label: "7 Days (1 Week)", hours: 168, tag: "Recommended" },
  { label: "30 Days (1 Month)", hours: 720, tag: "Long-term" },
];

export const LitShareModal: React.FC<LitShareModalProps> = ({
  document,
  wallet,
  onClose,
}) => {
  const [selectedHours, setSelectedHours] = useState<number>(168); // 7 days default
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [customValue, setCustomValue] = useState<number>(48);
  const [customUnit, setCustomUnit] = useState<"hours" | "days">("hours");

  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [customNote, setCustomNote] = useState<string>("");
  const [showConditionDetails, setShowConditionDetails] = useState<boolean>(false);
  const [showEmailPreview, setShowEmailPreview] = useState<boolean>(false);

  const [shareUrl, setShareUrl] = useState<string>("");
  const [payload, setPayload] = useState<LitSignedAccessPayload | null>(null);

  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedEmailText, setCopiedEmailText] = useState<boolean>(false);

  if (!document) return null;

  const fileName = document.manifest?.name || `document_${document.id}`;
  const fileVisual = getFileVisualConfig(fileName, document.manifest?.mimeType);
  const FileVisualIcon = fileVisual.Icon;
  const ownerAddress =
    document.owner ||
    wallet.address ||
    "0x0000000000000000000000000000000000000000";

  // Calculate actual duration hours
  const effectiveHours = isCustomDuration
    ? customUnit === "days"
      ? customValue * 24
      : customValue
    : selectedHours;

  // Regenerate Lit shareable link whenever configuration changes
  useEffect(() => {
    if (!document) return;
    const { url, payload: signedPayload } = generateLitShareableLink(
      document,
      ownerAddress,
      {
        durationHours: effectiveHours,
        recipientEmail: recipientEmail.trim() || undefined,
        note: customNote.trim() || undefined,
      }
    );
    setShareUrl(url);
    setPayload(signedPayload);
  }, [
    document,
    ownerAddress,
    effectiveHours,
    recipientEmail,
    customNote,
  ]);

  const emailContent = payload
    ? generateLitEmailShareContent(
        document,
        shareUrl,
        payload.expiresAt,
        recipientEmail,
        customNote
      )
    : null;

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);

    // Record audit event in Firestore
    if (document) {
      logDocumentActivity({
        docId: document.id,
        fileHash: document.fileHash,
        ownerId: wallet.address,
        ownerAddress: ownerAddress,
        action: "access_grant",
        title: "Lit Protocol Signed Access Grant",
        description: `Generated ${effectiveHours}h time-limited signed access grant${recipientEmail ? ` for ${recipientEmail}` : ""}.`,
        actor: `Owner (${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)})`,
        metadata: {
          durationHours: effectiveHours,
          expiresAt: payload?.expiresAt,
          recipientEmail: recipientEmail || "Public/Unrestricted Link",
          note: customNote || undefined,
        },
      });
    }
  };

  const handleCopyEmailText = () => {
    if (!emailContent) return;
    navigator.clipboard.writeText(emailContent.body);
    setCopiedEmailText(true);
    setTimeout(() => setCopiedEmailText(false), 3000);

    // Record audit event in Firestore
    if (document) {
      logDocumentActivity({
        docId: document.id,
        fileHash: document.fileHash,
        ownerId: wallet.address,
        ownerAddress: ownerAddress,
        action: "access_grant",
        title: "Lit Protocol Email Invitation Created",
        description: `Prepared and copied Lit Protocol email grant for ${recipientEmail || "recipient"} with ${effectiveHours}h expiration.`,
        actor: `Owner (${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)})`,
        metadata: {
          recipientEmail: recipientEmail || "Unspecified",
          durationHours: effectiveHours,
          expiresAt: payload?.expiresAt,
        },
      });
    }
  };

  const expirationDate = payload
    ? new Date(payload.expiresAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto transition-colors">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 my-6 animate-in fade-in zoom-in-95 duration-150 space-y-5 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-center">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Lit Protocol Secure Share
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Time-Limited Link
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Grant decentralized, cryptographic access to{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  {fileName}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Expiration Setting Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Access Expiration Window</span>
            </label>
            {payload && (
              <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-900/60">
                ⏳ {formatLitTimeRemaining(payload.expiresAt)} ({expirationDate})
              </span>
            )}
          </div>

          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DURATION_PRESETS.map((preset) => {
              const isSelected = !isCustomDuration && selectedHours === preset.hours;
              return (
                <button
                  key={preset.hours}
                  type="button"
                  onClick={() => {
                    setIsCustomDuration(false);
                    setSelectedHours(preset.hours);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <span className="text-xs font-bold">{preset.label}</span>
                  <span
                    className={`text-[10px] mt-0.5 font-medium ${
                      isSelected ? "text-indigo-100" : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {preset.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Duration Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsCustomDuration(!isCustomDuration)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isCustomDuration ? "Use preset durations" : "Set custom time duration..."}</span>
            </button>

            {isCustomDuration && (
              <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customValue}
                  onChange={(e) => setCustomValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value as "hours" | "days")}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  = {effectiveHours} total hours
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Email & Recipient Section */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Recipient Email & Message (Optional)</span>
          </label>

          <div className="space-y-2">
            <input
              type="email"
              id="lit-recipient-email-input"
              placeholder="e.g. colleague@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />

            <input
              type="text"
              id="lit-custom-note-input"
              placeholder="Add an optional note to include in email (e.g. Please review the financial report before Friday)..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          {/* Quick Email Share Launchers */}
          {emailContent && (
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Share via Email Client:
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <a
                  id="lit-share-mailto-btn"
                  href={emailContent.mailtoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
                  title="Open in default OS mail client (Apple Mail, Thunderbird, etc.)"
                >
                  <Mail className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Default Mail</span>
                </a>

                <a
                  id="lit-share-gmail-btn"
                  href={emailContent.gmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
                  title="Open compose window directly in Gmail"
                >
                  <span className="text-rose-500 font-bold">G</span>
                  <span>Gmail</span>
                </a>

                <a
                  id="lit-share-outlook-btn"
                  href={emailContent.outlookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
                  title="Open compose window in Outlook Web"
                >
                  <span className="text-blue-500 font-bold">O</span>
                  <span>Outlook</span>
                </a>

                <button
                  type="button"
                  id="lit-share-copy-email-body-btn"
                  onClick={handleCopyEmailText}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  title="Copy formatted email message body"
                >
                  {copiedEmailText ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                  )}
                  <span>{copiedEmailText ? "Copied Email!" : "Copy Email"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Email Preview Drawer Toggle */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowEmailPreview(!showEmailPreview)}
              className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
            >
              <span>{showEmailPreview ? "Hide formatted email text" : "Preview formatted email text"}</span>
              {showEmailPreview ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {showEmailPreview && emailContent && (
              <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                <p className="font-bold text-slate-700 dark:text-slate-200">
                  Subject: <span className="font-normal text-slate-600 dark:text-slate-300">{emailContent.subject}</span>
                </p>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap select-all">
                  {emailContent.body}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secure Share Link Output Box */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Signed Lit Protocol Link</span>
            </label>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
              EVM-Verified Access
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate select-all">
              {shareUrl}
            </span>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                id="lit-modal-copy-link-btn"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition"
                title="Test link in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Lit Protocol Cryptographic Details Toggle */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
          <button
            type="button"
            onClick={() => setShowConditionDetails(!showConditionDetails)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Cryptographic Access Conditions & Signature</span>
            </span>
            {showConditionDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showConditionDetails && payload && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-mono space-y-1.5 text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Protocol:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{payload.protocol}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">EVM Chain:</span>
                <span>{payload.chain}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Smart Contract:</span>
                <span className="truncate max-w-[220px]">{payload.contract}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Access Rule:</span>
                <span>ownerOf({payload.docId}) == {payload.owner.slice(0, 6)}...{payload.owner.slice(-4)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Issued At:</span>
                <span>{new Date(payload.issuedAt).toISOString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Expires At:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  {new Date(payload.expiresAt).toISOString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Signature (Keccak256):</span>
                <span className="truncate max-w-[200px] text-slate-500 select-all">{payload.signature}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
