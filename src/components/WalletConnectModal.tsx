import React, { useState, useEffect } from "react";
import {
  Wallet,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  Loader2,
  Radio,
  ArrowRight,
  Key,
  Cloud,
  Smartphone,
} from "lucide-react";
import type { User } from "firebase/auth";
import type { WalletState } from "../types";
import { isMetaMaskDetected, isRunningInIframe } from "../services/blockchain";
import { BLOCKNDRIVE_CONTRACT_ADDRESS } from "../constants/contract";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  currentUser?: User | null;
  onConnect: () => Promise<void>;
  onEnableDemo: () => void;
  onEnableDeviceVault?: () => void;
  onSignInGoogle?: () => Promise<void>;
  onDisconnect: () => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen,
  onClose,
  wallet,
  currentUser,
  onConnect,
  onEnableDemo,
  onEnableDeviceVault,
  onSignInGoogle,
  onDisconnect,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasMetaMask(isMetaMaskDetected());
      setInIframe(isRunningInIframe());
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectClick = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      await onConnect();
      onClose();
    } catch (err: any) {
      console.error("MetaMask connection failed:", err);
      setErrorMessage(
        err.message || "Failed to connect to MetaMask. Please unlock MetaMask and try again."
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGoogleClick = async () => {
    if (!onSignInGoogle) return;
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      await onSignInGoogle();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Google Sign-In failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleOpenNewTab = () => {
    if (typeof window !== "undefined") {
      window.open(window.location.href, "_blank", "noopener,noreferrer");
    }
  };

  const isRealMetaMaskConnected = wallet.isConnected && !wallet.isDemoMode && !wallet.networkName.includes("Device") && !wallet.networkName.includes("Google");
  const isDeviceVaultActive = wallet.isConnected && wallet.networkName.includes("Device");
  const isGoogleVaultActive = !!currentUser;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 relative my-8">
        {/* Close Button */}
        <button
          id="close-wallet-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Connect Vault & Security Identity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your identity provider for zero-knowledge encrypted storage
            </p>
          </div>
        </div>

        {/* Iframe Notice: Crucial for AI Studio Preview */}
        {inIframe && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Using the Embedded AI Studio Preview?</span>
                <span className="text-amber-800/90 dark:text-amber-300/90 text-[11px] leading-relaxed">
                  Browser extensions like MetaMask are restricted by Chrome/Brave security policies from injecting into iframe previews. You can use <strong>Google Sign-In</strong> or <strong>Device Vault</strong> right here, or open in a new tab for MetaMask.
                </span>
              </div>
            </div>
            <button
              id="open-new-tab-btn"
              onClick={handleOpenNewTab}
              className="mt-1 w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <span>Open App in New Tab for MetaMask</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Error message if any */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Notice</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Option 1: Google Cloud Vault (Best for Android & Play Store users) */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              isGoogleVaultActive
                ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700"
                : "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-700">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Google Cloud Vault
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Play Store Ready
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Firebase Cloud Sync • Multi-Device • Zero Wallet Setup
                  </span>
                </div>
              </div>
              {isGoogleVaultActive && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Signed In
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mb-2.5 leading-relaxed">
              Recommended for Android users. Syncs your encrypted documents to your private Google Firestore vault with decentralized IPFS fallback.
            </p>
            {!isGoogleVaultActive && onSignInGoogle && (
              <button
                onClick={handleGoogleClick}
                disabled={isGoogleLoading}
                className="w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>Continue with Google</span>
                )}
              </button>
            )}
          </div>

          {/* Option 2: MetaMask (Safest On-Chain Path) */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              isRealMetaMaskConnected
                ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700"
                : "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">🦊</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      MetaMask Web3 Registry
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      On-Chain Safest
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ethereum Sepolia • Immutable Proof • Smart Contract Sealing
                  </span>
                </div>
              </div>
              {isRealMetaMaskConnected && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              )}
            </div>

            <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mb-2.5 leading-relaxed">
              Registers cryptographic document hashes directly to Ethereum Sepolia with your wallet signature.
            </p>

            {isRealMetaMaskConnected ? (
              <div className="flex items-center justify-between pt-2 border-t border-emerald-200 dark:border-emerald-800/60">
                <div className="text-xs font-mono text-slate-700 dark:text-slate-300">
                  {wallet.address}
                </div>
                <button
                  onClick={onDisconnect}
                  className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  id="modal-connect-metamask-btn"
                  onClick={handleConnectClick}
                  disabled={isConnecting}
                  className="w-full sm:flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Connecting MetaMask...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="h-3.5 w-3.5" />
                      <span>Connect MetaMask</span>
                    </>
                  )}
                </button>

                {!hasMetaMask && !inIframe && (
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto py-2 px-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <span>Install</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Option 3: Local Device Vault (Zero extension required, pure self-custody) */}
          {onEnableDeviceVault && (
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                isDeviceVaultActive
                  ? "bg-violet-50/60 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700"
                  : "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 flex items-center justify-center">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Local Device Vault
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                        Self-Custody
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Web Crypto API • Instant Key • No Extension Required
                    </span>
                  </div>
                </div>
                {isDeviceVaultActive && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mb-2.5 leading-relaxed">
                Generates a cryptographically secure 256-bit AES master vault key on your device. Zero external accounts needed.
              </p>
              {!isDeviceVaultActive && (
                <button
                  onClick={() => {
                    onEnableDeviceVault();
                    onClose();
                  }}
                  className="w-full py-2 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Activate Local Device Vault
                </button>
              )}
            </div>
          )}

          {/* Option 4: Demo Sandbox Mode */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              wallet.isDemoMode
                ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                : "bg-slate-50/40 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🧪</span>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Demo Sandbox Mode
                  </span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">
                    Simulated Sepolia Testnet for instant feature testing
                  </span>
                </div>
              </div>
              {wallet.isDemoMode ? (
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full">
                  Selected
                </span>
              ) : (
                <button
                  onClick={() => {
                    onEnableDemo();
                    onClose();
                  }}
                  className="py-1 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Try Demo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info / Links */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <a
            href={`https://sepolia.etherscan.io/address/${BLOCKNDRIVE_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>Sepolia Contract: {BLOCKNDRIVE_CONTRACT_ADDRESS.slice(0, 6)}...{BLOCKNDRIVE_CONTRACT_ADDRESS.slice(-4)}</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>

          <a
            href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
            target="_blank"
            rel="noreferrer"
            className="hover:underline flex items-center gap-1"
          >
            <span>Get Sepolia ETH</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
