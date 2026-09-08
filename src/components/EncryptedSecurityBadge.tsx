import React, { useState, useRef, useEffect } from "react";
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  Key,
  Cpu,
  HelpCircle,
  ExternalLink,
  Shield,
  Layers,
  FileCheck,
} from "lucide-react";

interface EncryptedSecurityBadgeProps {
  fileName?: string;
  fileSize?: number;
  ownerAddress?: string | null;
  className?: string;
  variant?: "badge" | "pill" | "compact" | "icon";
  onOpenArchitecture?: () => void;
}

export const EncryptedSecurityBadge: React.FC<EncryptedSecurityBadgeProps> = ({
  fileName,
  fileSize,
  ownerAddress,
  className = "",
  variant = "badge",
  onOpenArchitecture,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<"top" | "bottom">("bottom");
  const badgeRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setTooltipPos(spaceBelow < 260 ? "top" : "bottom");
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (badgeRef.current && !badgeRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const truncate = (str: string, lead = 6, trail = 4) => {
    if (!str) return "";
    if (str.length <= lead + trail) return str;
    return `${str.slice(0, lead)}...${str.slice(-trail)}`;
  };

  return (
    <div
      ref={badgeRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Badge button trigger */}
      <button
        type="button"
        onClick={handleClick}
        id={`encrypted-security-badge-${fileName ? fileName.replace(/[^a-zA-Z0-9]/g, "-") : "doc"}`}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer select-none ${
          variant === "pill"
            ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 shadow-2xs"
            : variant === "compact"
            ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] py-0.2 px-1.5"
            : variant === "icon"
            ? "p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            : "bg-emerald-50/90 hover:bg-emerald-100/90 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80"
        } focus:outline-none focus:ring-2 focus:ring-emerald-500/40`}
        title="Verified Client-Side AES-256-GCM Encryption"
        aria-label="Encrypted Document Status: Client-side AES-256 verified"
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
      </button>

      {/* Rich Security Tooltip / Popover */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${
            tooltipPos === "top"
              ? "bottom-full mb-2"
              : "top-full mt-2"
          } left-0 sm:left-auto sm:right-0 z-50 w-72 sm:w-80 p-3.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-emerald-200 dark:border-emerald-800/80 text-left animate-in fade-in zoom-in-95 duration-150 transition-all`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>Client-Side Encrypted</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </h4>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  Zero-Knowledge Security Active
                </p>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              AES-GCM
            </span>
          </div>

          {/* Verification Points */}
          <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Pre-Storage Local Processing:
                </span>{" "}
                Encrypted locally in browser using Web Crypto API. Raw plaintext is never transmitted over the network.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Ciphertext Storage:
                </span>{" "}
                Stored on Lighthouse IPFS & Filecoin as scrambled binary bytes (<code className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">.enc</code>).
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Lit Protocol Key Access:
                </span>{" "}
                Decryption key is sealed with EVM conditions. Only wallet{" "}
                <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded text-slate-700 dark:text-slate-300">
                  {truncate(ownerAddress || "0x71C...Demo", 6, 4)}
                </span>{" "}
                can unseal and decrypt.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Tamper Proof:
                </span>{" "}
                SHA-256 digest is attested on Sepolia smart contracts to guarantee integrity.
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1 text-slate-400">
              <Lock className="h-3 w-3 text-emerald-500" />
              <span>AES-256-GCM / Web Crypto</span>
            </span>

            {onOpenArchitecture && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onOpenArchitecture();
                }}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>7 Goals Info</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
