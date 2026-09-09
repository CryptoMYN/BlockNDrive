import React, { useState } from "react";
import {
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  X,
  Sparkles,
  ShieldCheck,
  Fuel,
  Users,
  Send,
  QrCode,
  Globe,
  Wallet,
} from "lucide-react";

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress?: string | null;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  userAddress,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInviteText, setCopiedInviteText] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "invite" | "guide">("link");

  if (!isOpen) return null;

  // Derive the shareable application URL (shared preview or window origin)
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
        ? "https://ais-pre-fi7n2uugreoav4gc27dvpo-452737976933.asia-southeast1.run.app"
        : window.location.origin
      : "https://ais-pre-fi7n2uugreoav4gc27dvpo-452737976933.asia-southeast1.run.app";

  const inviteMessage = `🚀 Check out BlockNDrive: Decentralized Web3 Document Vault!\n\nConnect your personal MetaMask wallet on Ethereum Sepolia Testnet to get your own zero-knowledge encrypted cloud drive.\n\n✨ Features:\n- 🔐 In-Browser Client-Side AES-256-GCM Encryption\n- 🌐 Permanent Decentralized IPFS Storage via Lighthouse / Filecoin\n- 🤖 Chainlink CRE AI Risk Scoring & Attestation\n- ⏳ Time-Locked Lit Protocol Cryptographic Sharing\n- 📜 Sepolia Smart Contract Registry (Gas Tier)\n\nAccess it here: ${appUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteMessage);
    setCopiedInviteText(true);
    setTimeout(() => setCopiedInviteText(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 relative my-8">
        {/* Close Button */}
        <button
          id="close-share-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800">
            <Share2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Share BlockNDrive
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Globe className="h-3 w-3" /> Public & Universal
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Anyone with this link can connect their personal MetaMask and access their own decentralized drive
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("link")}
            className={`flex-1 py-1.5 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "link"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Accessible App Link</span>
          </button>
          <button
            onClick={() => setActiveTab("invite")}
            className={`flex-1 py-1.5 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "invite"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Invite Text</span>
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`flex-1 py-1.5 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "guide"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>New User Guide</span>
          </button>
        </div>

        {/* Tab 1: Direct Link */}
        {activeTab === "link" && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Public Application URL
              </label>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate flex-1 select-all">
                  {appUrl}
                </span>
                <button
                  id="copy-public-app-link-btn"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs"
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* What New Visitors Get */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2 text-xs">
              <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>How Any User Benefits Immediately:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold">1.</span>
                  <span><strong>Zero Sign-Up Required:</strong> They simply connect their personal MetaMask wallet.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold">2.</span>
                  <span><strong>Dedicated Personal Vault:</strong> Their documents are isolated and cryptographically sealed with their unique public key.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold">3.</span>
                  <span><strong>Free Storage & AI Included:</strong> Lighthouse Filecoin IPFS storage & Chainlink CRE AI analysis work out-of-the-box.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Ready-to-Send Message */}
        {activeTab === "invite" && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pre-Formatted Telegram / Discord / Email Invite
                </label>
                <button
                  id="copy-invite-msg-btn"
                  onClick={handleCopyInvite}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedInviteText ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                readOnly
                rows={7}
                value={inviteMessage}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-sans text-slate-700 dark:text-slate-300 resize-none focus:outline-none select-all"
              />
            </div>
          </div>
        )}

        {/* Tab 3: New User Onboarding Steps */}
        {activeTab === "guide" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Open in Chrome, Brave, or MetaMask Mobile
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Ensure MetaMask extension is enabled in your browser or use MetaMask in-app browser on mobile.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Switch to Sepolia Network
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Clicking "Connect MetaMask" will prompt MetaMask to automatically switch to Ethereum Sepolia.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Get Free Testnet Gas in 15 Seconds
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Use the built-in faucet helper to request free Sepolia ETH from Google Web3 or Chainlink faucets.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                4
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Enjoy Complete Decentralized Privacy
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Upload files, analyze risk with AI, verify IPFS hashes, and share with time-locked Lit links!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <a
            href={appUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Open in New Window</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
