import React, { useState } from "react";
import { Download, Share2, Smartphone, CheckCircle2, X } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface PWAInstallButtonProps {
  variant?: "nav" | "banner";
  onOpenPlayStoreGuide?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = "nav",
  onOpenPlayStoreGuide,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside installed standalone PWA / TWA, show installed badge or open Play Store guide
  if (isInstalled) {
    if (variant === "banner") return null;
    return (
      <button
        onClick={onOpenPlayStoreGuide}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
        title="App is running in Standalone PWA / Play Store mode"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Installed App</span>
      </button>
    );
  }

  // Desktop / Android Browser native install prompt
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 dark:shadow-none transition transform active:scale-95 cursor-pointer"
        title="Install BlockNDrive to your Android device, phone, or computer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Add to iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-[11px]">1</span>
                  <span>Tap the <strong>Share</strong> button in the Safari toolbar (square with arrow pointing up).</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-[11px]">2</span>
                  <span>Scroll down and select <strong>Add to Home Screen</strong>.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-[11px]">3</span>
                  <span>Tap <strong>Add</strong> in the top right corner to launch BlockNDrive as a full native app.</span>
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback: Button to open Play Store / PWA publishing guide
  return (
    <button
      onClick={onOpenPlayStoreGuide}
      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
      title="Google Play Store & PWA Publishing Details"
    >
      <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
      <span>Play Store Ready</span>
    </button>
  );
};
