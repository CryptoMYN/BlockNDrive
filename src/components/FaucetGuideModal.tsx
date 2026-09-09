import React, { useState } from "react";
import {
  Fuel,
  ExternalLink,
  Copy,
  CheckCircle2,
  X,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  HelpCircle,
  Zap,
} from "lucide-react";

interface FaucetGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string | null;
  balance?: string | null;
}

export const FaucetGuideModal: React.FC<FaucetGuideModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  balance,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const faucets = [
    {
      name: "Google Cloud Web3 Faucet",
      url: "https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
      amount: "0.05 Sepolia ETH / 24h",
      speed: "Fast (Instant)",
      badge: "Recommended",
      description: "Official Google Web3 faucet. Requires Google sign-in. Very reliable.",
    },
    {
      name: "Chainlink Faucet",
      url: "https://faucets.chain.link/sepolia",
      amount: "0.1 Sepolia ETH + 20 test LINK",
      speed: "Fast (10 seconds)",
      badge: "CRE Native",
      description: "Direct Chainlink Sepolia testnet faucet with free test tokens.",
    },
    {
      name: "Alchemy Sepolia Faucet",
      url: "https://sepoliafaucet.com/",
      amount: "0.5 Sepolia ETH",
      speed: "Instant",
      badge: "High Amount",
      description: "Provides larger testnet allocations with free Alchemy account.",
    },
    {
      name: "QuickNode Sepolia Faucet",
      url: "https://faucet.quicknode.com/ethereum/sepolia",
      amount: "0.05 Sepolia ETH",
      speed: "Instant",
      badge: "No Signup",
      description: "Quick drop faucet for instant transaction testing.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 relative my-8">
        {/* Close Button */}
        <button
          id="close-faucet-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800">
            <Fuel className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Sepolia Gas Faucet Hub
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> 100% Free
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Claim free testnet ETH to broadcast on-chain registrations & deletions
            </p>
          </div>
        </div>

        {/* User Address Quick Copy Card */}
        {walletAddress ? (
          <div className="mb-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Your Connected Wallet:
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {balance ? `${balance} ETH` : "0.0000 ETH"}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate flex-1 select-all">
                {walletAddress}
              </span>
              <button
                id="faucet-copy-address-btn"
                onClick={copyAddress}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Address</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Connect your MetaMask first to copy your address with 1 click.</span>
          </div>
        )}

        {/* Faucet List */}
        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
          {faucets.map((faucet, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {faucet.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                    {faucet.badge}
                  </span>
                </div>
                <a
                  href={faucet.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-slate-900 hover:bg-indigo-600 dark:bg-slate-700 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shrink-0"
                >
                  <span>Claim</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                {faucet.description}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
                <span>🎁 {faucet.amount}</span>
                <span>⚡ {faucet.speed}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Notice Info */}
        <div className="mt-4 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
          <span className="font-semibold">💡 What is Sepolia Gas?</span> Sepolia is the standard Ethereum testnet. Gas is required by EVM nodes to prevent spam and record immutable document ownership, but testnet tokens are always 100% free!
        </div>

        {/* Done Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
