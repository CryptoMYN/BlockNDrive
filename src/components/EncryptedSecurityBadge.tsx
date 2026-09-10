import React from "react";
import { Lock } from "lucide-react";

interface EncryptedSecurityBadgeProps {
  fileName?: string;
  fileSize?: number;
  ownerAddress?: string | null;
  className?: string;
  variant?: "badge" | "pill" | "compact" | "icon";
}

export const EncryptedSecurityBadge: React.FC<EncryptedSecurityBadgeProps> = ({
  fileName,
  className = "",
  variant = "badge",
}) => {
  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      title="Verified Client-Side AES-256-GCM: Encrypted locally in browser before decentralized IPFS storage"
    >
      <span
        id={`encrypted-security-badge-${fileName ? fileName.replace(/[^a-zA-Z0-9]/g, "-") : "doc"}`}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
          variant === "pill"
            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 shadow-2xs"
            : variant === "compact"
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] py-0.2 px-1.5"
            : variant === "icon"
            ? "p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            : "bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80"
        }`}
        aria-label="Client-side AES-256 verified"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
        {variant !== "icon" && (
          <span className="font-semibold tracking-tight">Encrypted</span>
        )}
        <span className="text-[9px] font-mono opacity-80 hidden sm:inline-block">AES-256</span>
      </span>
    </div>
  );
};
