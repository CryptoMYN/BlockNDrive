import React, { useState, useEffect } from "react";
import {
  Wallet,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
  ArrowUpRight,
  Flame,
  Fuel,
} from "lucide-react";
import type { WalletState } from "../types";
import { isMetaMaskDetected, isRunningInIframe, switchToSepolia } from "../services/blockchain";
import { BLOCKNDRIVE_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from "../constants/contract";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onConnect,
  onDisconnect,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
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

  const handleSwitchNetwork = async () => {
    setIsSwitchingNetwork(true);
    try {
      const success = await switchToSepolia();
      if (success) {
        setErrorMessage(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to switch network to Sepolia.");
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const handleOpenNewTab = () => {
    if (typeof window !== "undefined") {
      window.open(window.location.href, "_blank", "noopener,noreferrer");
    }
  };

  const isRealMetaMaskConnected = wallet.isConnected && !!wallet.address;
  const isWrongNetwork = isRealMetaMaskConnected && wallet.chainId !== SEPOLIA_CHAIN_ID;
  const hasZeroBalance = isRealMetaMaskConnected && (wallet.balance === "0.0000" || wallet.balance === "0" || !wallet.balance);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
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
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800 text-2xl">
            🦊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                On-Chain Gas Tier Wallet
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <Fuel className="h-3 w-3" /> Gas Required
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pure Web3 authentication & smart contract execution on Ethereum Sepolia
            </p>
          </div>
        </div>

        {/* Iframe Notice: For AI Studio Preview */}
        {inIframe && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Using the Embedded AI Studio Preview?</span>
                <span className="text-amber-800/90 dark:text-amber-300/90 text-[11px] leading-relaxed">
                  Browser extensions like MetaMask cannot inject into iframe windows for security reasons. Open the app in a new browser tab to connect your real wallet and broadcast on-chain gas transactions.
                </span>
              </div>
            </div>
            <button
              id="open-new-tab-btn"
              onClick={handleOpenNewTab}
              className="mt-1 w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <span>Open in New Tab for MetaMask</span>
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

        {/* Main MetaMask Card */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isRealMetaMaskConnected
              ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700"
              : "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl leading-none">🦊</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    MetaMask
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    Sepolia Network
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  EVM Signatures • On-Chain Smart Contract • Non-Repudiation Proofs
                </span>
              </div>
            </div>
            {isRealMetaMaskConnected && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full shrink-0">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
            Every document upload and deletion in this app is recorded as a permanent, immutable transaction on the Ethereum Sepolia smart contract requiring MetaMask signatures and network gas.
          </p>

          {isRealMetaMaskConnected ? (
            <div className="space-y-2.5 pt-2 border-t border-emerald-200/80 dark:border-emerald-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Wallet Address:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded">
                  {wallet.address}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Sepolia ETH Balance:</span>
                <span className={`font-mono font-bold ${hasZeroBalance ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {wallet.balance ? `${wallet.balance} ETH` : "0.0000 ETH"}
                </span>
              </div>

              {hasZeroBalance && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
                    <Fuel className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>0 ETH Detected - You need Sepolia Gas</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                    On-Chain Gas Tier requires a tiny amount of free Sepolia ETH to broadcast transactions. Claim free testnet tokens from faucets below:
                  </p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <a
                      href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                    >
                      <span>Google Web3 Faucet</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href="https://faucets.chain.link/sepolia"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <span>Chainlink Faucet</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {isWrongNetwork && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-2">
                  <span className="text-xs text-rose-800 dark:text-rose-200 font-medium">
                    Wrong network detected. Switch to Sepolia.
                  </span>
                  <button
                    onClick={handleSwitchNetwork}
                    disabled={isSwitchingNetwork}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    {isSwitchingNetwork ? "Switching..." : "Switch to Sepolia"}
                  </button>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={onDisconnect}
                  className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Disconnect MetaMask
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                id="modal-connect-metamask-btn"
                onClick={handleConnectClick}
                disabled={isConnecting}
                className="w-full sm:flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shadow-indigo-200 dark:shadow-none"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connecting MetaMask...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    <span>Connect MetaMask (On-Chain Gas Tier)</span>
                  </>
                )}
              </button>

              {!hasMetaMask && !inIframe && (
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto py-2.5 px-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <span>Install Extension</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Free Sepolia Gas Faucets Card */}
        <div className="mt-4 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <Fuel className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Need Free Sepolia Gas?</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
            Since this app runs exclusively on the On-Chain Gas Tier, you do not need real money. Sepolia testnet ETH is 100% free from verified public faucets:
          </p>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <a
              href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Google Web3 Faucet</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <a
              href="https://sepoliafaucet.com/"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Alchemy Faucet</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <a
              href="https://faucets.chain.link/sepolia"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Chainlink Faucet</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Footer Info / Links */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
            <a
              href={`https://sepolia.etherscan.io/address/${BLOCKNDRIVE_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Sepolia Contract: {BLOCKNDRIVE_CONTRACT_ADDRESS.slice(0, 6)}...{BLOCKNDRIVE_CONTRACT_ADDRESS.slice(-4)}</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>

            <span className="text-slate-400 dark:text-slate-500 font-mono">
              Chain ID: 11155111
            </span>
          </div>

          <button
            id="return-to-dashboard-btn"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
