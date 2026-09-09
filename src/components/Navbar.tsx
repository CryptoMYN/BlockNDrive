import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  Wallet,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  Copy,
  Terminal,
  FileCode,
  LogIn,
  LogOut,
  User as UserIcon,
  Cloud,
  CloudCheck,
  Sun,
  Moon,
  Server,
} from "lucide-react";
import type { User } from "firebase/auth";
import {
  BLOCKNDRIVE_CONTRACT_ADDRESS,
  CRE_FORWARDER_ADDRESS,
} from "../constants/contract";
import type { WalletState } from "../types";
import { LighthouseStatusIndicator } from "./LighthouseStatusIndicator";
import { LighthouseStorageManagerModal } from "./LighthouseStorageManagerModal";
import { ProjectOverviewModal } from "./ProjectOverviewModal";
import { PWAInstallButton } from "./PWAInstallButton";

interface NavbarProps {
  wallet: WalletState;
  currentUser: User | null;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleDemoMode: () => void;
  onSignInGoogle: () => void;
  onSignOutGoogle: () => void;
  onOpenWalletModal?: () => void;
  onOpenPlayStoreGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  wallet,
  currentUser,
  isDark = false,
  onToggleTheme,
  onConnect,
  onDisconnect,
  onToggleDemoMode,
  onSignInGoogle,
  onSignOutGoogle,
  onOpenWalletModal,
  onOpenPlayStoreGuide,
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
                    v1.0 Vault
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                  Decentralized Encrypted Document Registry
                </p>
              </div>
            </div>

            {/* Contract, Overview and Network Info */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <button
                id="project-overview-trigger"
                onClick={() => setShowOverviewModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold transition cursor-pointer"
                title="View BlockNDrive Architecture & 7 Main Goals"
              >
                <Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>7 Goals & Architecture</span>
              </button>

              <button
                id="contract-info-trigger"
                onClick={() => setShowContractInfo(true)}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                title="View Smart Contract Details"
              >
                <FileCode className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-medium text-slate-500 dark:text-slate-400">Contract:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {truncate(BLOCKNDRIVE_CONTRACT_ADDRESS, 6, 4)}
                </span>
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium">Sepolia EVM</span>
              </div>

              {/* Lighthouse IPFS Storage Status Indicator */}
              <LighthouseStatusIndicator
                onClick={() => setShowLighthouseModal(true)}
                variant="pill"
              />
            </div>

            {/* Right Side: Theme Toggle, Google Auth & Wallet Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
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

              {/* PWA & Google Play Store Install Action */}
              <PWAInstallButton onOpenPlayStoreGuide={onOpenPlayStoreGuide} />

              {/* Google Authentication Button / User Profile */}
              {currentUser ? (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 pr-2.5">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || "User"}
                      className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-600"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                      {currentUser.displayName?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}

                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[110px]">
                      {currentUser.displayName || "Google User"}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Cloud className="h-2.5 w-2.5" /> Firestore Active
                    </span>
                  </div>

                  <button
                    onClick={onSignOutGoogle}
                    title="Sign out of Google"
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition ml-1"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  id="google-signin-btn"
                  onClick={onSignInGoogle}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              )}

              {/* Wallet Actions */}
              {wallet.isConnected && !wallet.isDemoMode ? (
                /* REAL METAMASK CONNECTED */
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenWalletModal || onConnect}
                    className="hidden md:flex flex-col text-right hover:opacity-80 transition cursor-pointer"
                    title="MetaMask connected on Sepolia. Click for wallet details."
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 font-mono">
                        {truncate(wallet.address || "", 6, 4)}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {wallet.balance ? `${wallet.balance} SEP` : "Sepolia"} • Safest Active
                    </span>
                  </button>

                  <button
                    id="wallet-account-btn"
                    onClick={onDisconnect}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
                    title="Disconnect MetaMask"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-mono sm:hidden">
                      {truncate(wallet.address || "", 4, 3)}
                    </span>
                    <span className="hidden sm:inline">Disconnect</span>
                  </button>
                </div>
              ) : (
                /* DEMO MODE OR DISCONNECTED: Prominent Connect MetaMask Button */
                <div className="flex items-center gap-2">
                  {wallet.isDemoMode && (
                    <button
                      id="demo-mode-badge-btn"
                      onClick={onOpenWalletModal || onConnect}
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer"
                      title="Currently running in simulated Demo Mode. Click to view wallet options."
                    >
                      <span>🧪 Demo Mode</span>
                    </button>
                  )}

                  <button
                    id="connect-metamask-nav-btn"
                    onClick={onOpenWalletModal || onConnect}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm shadow-indigo-200 dark:shadow-none transition cursor-pointer"
                    title="Connect your MetaMask wallet for on-chain Sepolia security (Safest path)"
                  >
                    <span className="text-sm leading-none">🦊</span>
                    <span>Connect MetaMask</span>
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
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
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
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition"
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
                <span className="font-semibold">Security Architecture:</span> Actual documents are NEVER sent or stored on-chain. Encrypted off-chain via AES-256 in browser, stored on Lighthouse IPFS/Filecoin, with references, ownership, hashes, and Chainlink CRE AI risk scores attested on-chain and backed by Firestore database persistence.
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
