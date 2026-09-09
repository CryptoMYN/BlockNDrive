import React from "react";
import {
  Wallet,
  ShieldCheck,
  Fuel,
  ExternalLink,
  Sparkles,
  Lock,
  Globe,
  HardDrive,
  Cpu,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type { WalletState } from "../types";
import { isRunningInIframe } from "../services/blockchain";
import { BLOCKNDRIVE_CONTRACT_ADDRESS } from "../constants/contract";

interface PublicOnboardingHeroProps {
  wallet: WalletState;
  onConnectMetaMask: () => void;
  onOpenShareModal?: () => void;
  onOpenFaucetModal?: () => void;
}

export const PublicOnboardingHero: React.FC<PublicOnboardingHeroProps> = ({
  wallet,
  onConnectMetaMask,
}) => {
  const inIframe = isRunningInIframe();

  const handleOpenNewTab = () => {
    if (typeof window !== "undefined") {
      window.open(window.location.href, "_blank", "noopener,noreferrer");
    }
  };

  if (wallet.isConnected && wallet.address) {
    return (
      <div className="my-5 p-4 sm:p-5 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50/80 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs text-xl">
            🦊
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Personal Web3 Vault Active
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Client-side AES-256 encrypted storage tied to your Ethereum Sepolia keypair
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-medium">On-Chain Gas Tier</span>
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <a
            href={`https://sepolia.etherscan.io/address/${BLOCKNDRIVE_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
          >
            <span>Contract</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="my-6 p-6 sm:p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-800/50">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Decentralized Web3 Document Vault</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mb-2">
          Your Own Private Cloud Drive — Authenticated by MetaMask
        </h1>

        <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed mb-6">
          No passwords or third-party servers. Connect your MetaMask wallet to access your private decentralized document vault with in-browser AES-256 encryption, Chainlink CRE AI analysis, and permanent Filecoin/IPFS storage on Ethereum Sepolia.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs mb-1">
              <Lock className="h-3.5 w-3.5" />
              <span>Zero-Knowledge</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Files are encrypted locally in your browser before ever uploading.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs mb-1">
              <HardDrive className="h-3.5 w-3.5" />
              <span>IPFS & Filecoin</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Decentralized storage via Lighthouse with permanent CID addressability.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs mb-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>On-Chain Gas Tier</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Smart contract registry on Ethereum Sepolia Testnet.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            id="hero-connect-metamask-btn"
            onClick={onConnectMetaMask}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-black/20"
          >
            <span className="text-base leading-none">🦊</span>
            <span>Connect MetaMask Wallet</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          {inIframe && (
            <button
              onClick={handleOpenNewTab}
              className="w-full sm:w-auto px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open in New Tab for Extension</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
