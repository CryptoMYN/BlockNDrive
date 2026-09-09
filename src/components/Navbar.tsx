import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  Wallet,
  ExternalLink,
  CheckCircle2,
  Copy,
  FileCode,
  Sun,
  Moon,
  Sparkles,
  Fuel,
  Share2,
} from "lucide-react";
import {
  BLOCKNDRIVE_CONTRACT_ADDRESS,
  CRE_FORWARDER_ADDRESS,
} from "../constants/contract";
import type { WalletState } from "../types";
import { LighthouseStatusIndicator } from "./LighthouseStatusIndicator";
import { LighthouseStorageManagerModal } from "./LighthouseStorageManagerModal";
import { ProjectOverviewModal } from "./ProjectOverviewModal";

interface NavbarProps {
  wallet: WalletState;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenWalletModal?: () => void;
  onOpenShareModal?: () => void;
  onOpenFaucetModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  wallet,
  isDark = false,
  onToggleTheme,
  onConnect,
  onDisconnect,
  onOpenWalletModal,
  onOpenShareModal,
  onOpenFaucetModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [showContractInfo, setShowContractInfo] = useState(false);
  const [showLighthouseModal, setShowLighthouseModal] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);

  const copyContract = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(BLOCKNDRIVE_CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncate = (str: string, lead = 6, trail = 4) => {
    if (!str) return "";
    if (str.length <= lead + trail) return str;
    return `${str.slice(0, lead)}...${str.slice(-trail)}`;
  };

  return (
    <>
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 dark:shadow-none shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                    Block<span className="text-indigo-600 dark:text-indigo-400">N</span>Drive
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-full border border-indigo-100/80 dark:border-indigo-900/50">
                    On-Chain Gas Tier
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                  Decentralized Encrypted Document Vault & Sepolia Smart Contract Registry
                </p>
              </div>
            </div>

            {/* Center Status Indicators */}
            <div className="hidden lg:flex items-center gap-2.5 text-xs">
              <a
                href={`https://sepolia.etherscan.io/address/${BLOCKNDRIVE_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                title="View Smart Contract on Etherscan"
              >
                <FileCode className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-medium text-slate-500 dark:text-slate-400">Sepolia Contract:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {truncate(BLOCKNDRIVE_CONTRACT_ADDRESS, 6, 4)}
                </span>
              </a>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium">Sepolia EVM (11155111)</span>
              </div>

              {/* Lighthouse IPFS Storage Status Indicator */}
              <LighthouseStatusIndicator
                onClick={() => setShowLighthouseModal(true)}
                variant="pill"
              />
            </div>

            {/* Right Side: Share, Faucet, Theme Toggle & MetaMask Wallet */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Share Accessible App Link Button */}
              {onOpenShareModal && (
                <button
                  id="share-app-nav-btn"
                  onClick={onOpenShareModal}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition cursor-pointer shadow-2xs"
                  title="Share accessible link with anyone"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}

              {/* Free Faucets Hub Button */}
              {onOpenFaucetModal && (
                <button
                  id="faucet-hub-nav-btn"
                  onClick={onOpenFaucetModal}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-800 dark:text-amber-200 transition cursor-pointer shadow-2xs"
                  title="Get Free Sepolia Gas Tokens"
                >
                  <Fuel className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline">Free Gas</span>
                </button>
              )}

              {/* Dark Mode Toggle Button */}
              {onToggleTheme && (
                <button
                  id="dark-mode-toggle-btn"
                  onClick={onToggleTheme}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? (
                    <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
                  ) : (
                    <Moon className="h-4 w-4 text-slate-600 transition-transform hover:-rotate-12" />
                  )}
                </button>
              )}

              {/* MetaMask Pure Web3 Wallet Actions */}
              {wallet.isConnected && wallet.address ? (
                /* REAL METAMASK CONNECTED */
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={onOpenWalletModal || onConnect}
                    className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    title="MetaMask connected on Sepolia. Click for wallet details."
                  >
                    <span className="text-base leading-none">🦊</span>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 font-mono">
                          {truncate(wallet.address || "", 5, 3)}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold leading-tight">
                        {wallet.balance ? `${wallet.balance} ETH` : "Sepolia"}
                      </span>
                    </div>
                  </button>

                  <button
                    id="wallet-account-btn"
                    onClick={onDisconnect}
                    className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
                    title="Disconnect MetaMask"
                  >
                    <span className="hidden sm:inline">Disconnect</span>
                    <span className="sm:hidden text-[11px]">Exit</span>
                  </button>
                </div>
              ) : (
                /* DISCONNECTED: Prominent Connect MetaMask Button */
                <div className="flex items-center gap-2">
                  <button
                    id="connect-metamask-nav-btn"
                    onClick={onOpenWalletModal || onConnect}
                    className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm shadow-indigo-200 dark:shadow-none transition cursor-pointer whitespace-nowrap"
                    title="Connect your MetaMask wallet for on-chain Sepolia Gas Tier execution"
                  >
                    <span className="text-sm leading-none">🦊</span>
                    <span className="hidden xs:inline sm:inline">Connect MetaMask</span>
                    <span className="xs:hidden sm:hidden inline">Connect</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contract Info Modal */}
      {showContractInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <FileCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Deployed Smart Contract
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">BlockNDrive Registry on Ethereum Sepolia</p>
                </div>
              </div>
              <button
                onClick={() => setShowContractInfo(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Contract Address
                </label>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-slate-800 dark:text-slate-200 break-all select-all flex-1">
                    {BLOCKNDRIVE_CONTRACT_ADDRESS}
                  </span>
                  <button
                    onClick={copyContract}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="Copy Address"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={`https://sepolia.etherscan.io/address/${BLOCKNDRIVE_CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition"
                    title="View on Etherscan"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Chainlink CRE Forwarder
                </label>
                <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300 break-all">
                  {CRE_FORWARDER_ADDRESS}
                </div>
              </div>

              <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl p-3 text-amber-900 dark:text-amber-200 leading-relaxed">
                <span className="font-semibold">On-Chain Gas Tier Architecture:</span> Actual documents are encrypted off-chain via AES-256 in browser, stored on Lighthouse IPFS/Filecoin. All manifests, ownership, CIDs, SHA-256 hashes, and Chainlink CRE AI risk scores are permanently attested and registered on-chain via MetaMask gas transactions.
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowContractInfo(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lighthouse Storage & Diagnostics Modal */}
      <LighthouseStorageManagerModal
        isOpen={showLighthouseModal}
        onClose={() => setShowLighthouseModal(false)}
      />

      {/* Project Overview & 7 Goals Architecture Modal */}
      <ProjectOverviewModal
        isOpen={showOverviewModal}
        onClose={() => setShowOverviewModal(false)}
        onOpenLighthouseDiagnostics={() => setShowLighthouseModal(true)}
      />
    </>
  );
};
