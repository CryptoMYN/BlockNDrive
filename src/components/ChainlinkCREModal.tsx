import React from "react";
import { X, Cpu, ShieldCheck, ArrowRight, Layers, Database, Lock, CheckCircle2 } from "lucide-react";
import { CRE_FORWARDER_ADDRESS, BLOCKNDRIVE_CONTRACT_ADDRESS } from "../constants/contract";
import type { VaultDocument } from "../types";
import { CRERiskTrendChart } from "./CRERiskTrendChart";

interface ChainlinkCREModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents?: VaultDocument[];
  onSelectDocument?: (doc: VaultDocument) => void;
}

export const ChainlinkCREModal: React.FC<ChainlinkCREModalProps> = ({
  isOpen,
  onClose,
  documents = [],
  onSelectDocument,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto transition-colors">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl sm:max-w-3xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 my-8 animate-in fade-in zoom-in-95 duration-150 transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Chainlink CRE (Chainlink Runtime Environment)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Decentralized Oracle AI Risk & Metadata Attestation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs">
          {/* D3.js Historical Risk Trend Mini-Chart */}
          <CRERiskTrendChart
            documents={documents}
            onSelectDocument={onSelectDocument}
          />

          {/* Architecture Flow */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Attestation Pipeline Architecture</span>
            </h4>

            <div className="space-y-2 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <Lock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>1. User Client</span>
                <ArrowRight className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="text-slate-800 dark:text-slate-200">AES-256 off-chain encryption</span>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <Database className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>2. Lighthouse</span>
                <ArrowRight className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="text-slate-800 dark:text-slate-200">Filecoin / IPFS pinning (Manifest CID)</span>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <Cpu className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>3. Chainlink CRE</span>
                <ArrowRight className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="text-slate-800 dark:text-slate-200">AI Metadata & Risk Score (0 - 100)</span>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>4. DON Consensus</span>
                <ArrowRight className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="text-slate-800 dark:text-slate-200">Forwarder verification via onReport()</span>
              </div>
            </div>
          </div>

          {/* CRE Report Format */}
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              CRE Report ABI Encoding
            </span>
            <div className="p-3 bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto border border-transparent dark:border-slate-800">
              {`abi.encode(\n  uint256 documentId,\n  string manifestCID,\n  bytes32 manifestHash,\n  uint8 riskScore\n)`}
            </div>
          </div>

          {/* Contract addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">CRE Keystone Forwarder</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 break-all select-all block mt-0.5">
                {CRE_FORWARDER_ADDRESS}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">BlockNDrive Contract</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 break-all select-all block mt-0.5">
                {BLOCKNDRIVE_CONTRACT_ADDRESS}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
