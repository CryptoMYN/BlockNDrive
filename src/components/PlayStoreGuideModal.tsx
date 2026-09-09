import React, { useState } from "react";
import {
  Smartphone,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Package,
  FileCode,
  Download,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";

interface PlayStoreGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayStoreGuideModal: React.FC<PlayStoreGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentHost = typeof window !== "undefined" ? window.location.origin : "https://blockndrive.app";

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const bubblewrapCommand = `npx @bubblewrap/cli init --manifest=${currentHost}/manifest.webmanifest`;
  const assetlinksJson = JSON.stringify(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.blockndrive.vault",
          sha256_cert_fingerprints: [
            "YOUR_APP_SIGNING_SHA256_FINGERPRINT_FROM_GOOGLE_PLAY_CONSOLE",
          ],
        },
      },
    ],
    null,
    2
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Google Play Store Publishing Guide
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                  TWA Compliant
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Turn BlockNDrive into a certified Android App Bundle (.aab) for the Play Store
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* Status checklist */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60">
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Production & Play Store Audit Verification</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Web App Manifest configured</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>192x192 & 512x512 icons present</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Android Maskable safe-zone icon</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Service Worker offline caching</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Google Sign-In + Cloud Firestore Vault</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Device Web Crypto Vault (No MetaMask required on mobile)</span>
              </div>
            </div>
          </div>

          {/* Publishing Method 1: PWABuilder (Fastest, zero terminal required) */}
          <div className="border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Fastest Method: PWABuilder (Recommended)
                </h4>
              </div>
              <a
                href="https://www.pwabuilder.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                <span>pwabuilder.com</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              PWABuilder is Microsoft and Google's official open-source tool to generate signed Android App Bundles (.aab) directly in your browser.
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-400 pl-1">
              <li>Open <strong>pwabuilder.com</strong> in a new tab.</li>
              <li>Paste your app URL: <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border text-indigo-600 dark:text-indigo-400 select-all">{currentHost}</code></li>
              <li>Click <strong>Start</strong> &rarr; verify the high PWA score.</li>
              <li>Click <strong>Package for Stores &rarr; Android</strong>.</li>
              <li>Download your signed <strong>.aab</strong> package ready for upload to Google Play Console!</li>
            </ol>
          </div>

          {/* Publishing Method 2: Google Bubblewrap CLI */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Google Bubblewrap CLI (Command Line)
                </h4>
              </div>
              <a
                href="https://github.com/GoogleChromeLabs/bubblewrap"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <span>Google Chrome Labs</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-2">
              Run this single command on your terminal to initialize a Trusted Web Activity (TWA) Android project:
            </p>
            <div className="flex items-center justify-between bg-slate-900 text-slate-100 font-mono text-[11px] p-2.5 rounded-lg">
              <span className="truncate">{bubblewrapCommand}</span>
              <button
                onClick={() => copyToClipboard(bubblewrapCommand, "bubblewrap")}
                className="ml-2 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition"
                title="Copy Command"
              >
                {copiedSection === "bubblewrap" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Digital Asset Links (.well-known/assetlinks.json) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileCode className="h-4 w-4 text-indigo-500" />
                <span>Digital Asset Links (<code className="font-mono text-[11px]">.well-known/assetlinks.json</code>)</span>
              </h4>
              <button
                onClick={() => copyToClipboard(assetlinksJson, "assetlinks")}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                {copiedSection === "assetlinks" ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] mb-2">
              To hide the browser address bar in the Play Store app, link your app's SHA-256 fingerprint from the Google Play Console under <strong>Setup &rarr; App Signing</strong>:
            </p>
            <pre className="bg-slate-900 text-slate-100 font-mono text-[10.5px] p-3 rounded-lg overflow-x-auto">
              {assetlinksJson}
            </pre>
          </div>

          {/* Google Play Console Setup Steps */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-4">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Google Play Console Submission Checklist</span>
            </h4>
            <ul className="space-y-1.5 text-emerald-900 dark:text-emerald-200 pl-1 list-disc list-inside">
              <li>Log in to <strong>play.google.com/console</strong>.</li>
              <li>Create a new App &rarr; Title: <strong>BlockNDrive: Decentralized Vault</strong>.</li>
              <li>Default language: <strong>English (United States)</strong>.</li>
              <li>App Category: <strong>Productivity / Utilities</strong>.</li>
              <li>Upload the generated <strong>.aab</strong> bundle under <strong>Production</strong> or <strong>Closed Testing</strong> track.</li>
              <li>Include privacy policy: Zero-knowledge encryption, files stored client-side and on decentralized IPFS.</li>
              <li>Submit for review!</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            BlockNDrive v1.0 • Ready for Production & Play Store
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
