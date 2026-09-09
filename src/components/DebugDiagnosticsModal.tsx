import React, { useState, useEffect } from "react";
import { Terminal, Shield, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, X, Cpu, Database } from "lucide-react";
import { BLOCKNDRIVE_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from "../constants/contract";
import { getStoredDocuments } from "../services/blockchain";

interface DebugDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string | null;
  chainId: number | null;
  balance: string;
}

export const DebugDiagnosticsModal: React.FC<DebugDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  chainId,
  balance,
}) => {
  const [localDocsCount, setLocalDocsCount] = useState(0);
  const [networkStatus, setNetworkStatus] = useState<string>("Checking...");
  const [rpcStatus, setRpcStatus] = useState<string>("Connected");

  useEffect(() => {
    if (isOpen) {
      try {
        const docs = getStoredDocuments();
        setLocalDocsCount(docs.length);
      } catch {
        setLocalDocsCount(0);
      }

      if (window.ethereum) {
        window.ethereum
          .request({ method: "eth_chainId" })
          .then((id: any) => {
            const decId = parseInt(id, 16);
            if (decId === SEPOLIA_CHAIN_ID) {
              setNetworkStatus("Ethereum Sepolia Testnet (Correct)");
            } else {
              setNetworkStatus(`Wrong Network (Chain ID: ${decId})`);
            }
          })
          .catch(() => setNetworkStatus("Could not verify chain ID"));
      } else {
        setNetworkStatus("No Web3 Provider (MetaMask not detected)");
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-slate-100 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">BlockNDrive Diagnostics & Debug</h3>
              <p className="text-xs text-slate-400">Real-time Web3 & Smart Contract Health Inspector</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close diagnostics"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-4 text-xs font-mono">
          {/* Network State */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-400" />
                Network Status:
              </span>
              <span className={chainId === SEPOLIA_CHAIN_ID ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                {networkStatus}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Chain ID: {chainId || "Not Connected"}</span>
              <span>Required: {SEPOLIA_CHAIN_ID} (Sepolia)</span>
            </div>
          </div>

          {/* Wallet & Balance */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-400" />
                Connected Wallet:
              </span>
              <span className="text-white font-bold truncate max-w-[240px]">
                {walletAddress || "Not Connected"}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Sepolia ETH Balance:</span>
              <span className={balance === "0.0000" || balance === "0" ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                {balance} ETH
              </span>
            </div>
          </div>

          {/* Smart Contract */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-400" />
                Smart Contract (Sepolia):
              </span>
              <a
                href={`https://sepolia.etherscan.io/address/${BLOCKNDRIVE_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>{BLOCKNDRIVE_CONTRACT_ADDRESS.slice(0, 6)}...{BLOCKNDRIVE_CONTRACT_ADDRESS.slice(-4)}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Cached Local Documents:</span>
              <span className="text-white">{localDocsCount} records</span>
            </div>
          </div>

          {/* Troubleshooting tips */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-indigo-200 space-y-1.5 text-[11px]">
            <p className="font-bold text-indigo-300">💡 Troubleshooting Guide:</p>
            <ul className="list-disc list-inside space-y-1 text-indigo-200/90 font-sans">
              <li>Ensure MetaMask is connected to <strong>Sepolia Testnet</strong> (Chain ID 11155111).</li>
              <li>Make sure your wallet has a small amount of Sepolia Test ETH for gas fees.</li>
              <li>When viewing transactions on Etherscan, your transaction shows under <strong>Your Wallet Address → Transactions</strong> or by clicking the exact transaction hash in BlockNDrive.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg transition cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
