import React, { useState } from "react";
import {
  Shield,
  Lock,
  UserCheck,
  Globe,
  Link,
  Cpu,
  ShieldAlert,
  FolderLock,
  ExternalLink,
  X,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Database,
  Key,
  Layers,
  FileCheck,
  Server,
  Zap,
} from "lucide-react";
import {
  BLOCKNDRIVE_CONTRACT_ADDRESS,
  CRE_FORWARDER_ADDRESS,
} from "../constants/contract";

interface ProjectOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLighthouseDiagnostics?: () => void;
  onOpenCREModal?: () => void;
}

export const ProjectOverviewModal: React.FC<ProjectOverviewModalProps> = ({
  isOpen,
  onClose,
  onOpenLighthouseDiagnostics,
  onOpenCREModal,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "goals" | "architecture" | "specs">("overview");

  if (!isOpen) return null;

  const goals = [
    {
      id: 1,
      icon: Lock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
      title: "1. 🔐 Privacy & Security",
      tagline: "Keep documents encrypted so unauthorized parties cannot read them.",
      description:
        "Every file is encrypted client-side using AES-GCM-256 inside the user's browser before transmission. Plaintext data never touches storage nodes or backend servers.",
      tech: "AES-GCM-256 • Web Crypto API • Random 96-bit IVs",
    },
    {
      id: 2,
      icon: UserCheck,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
      title: "2. 👤 Owner-only Access",
      tagline: "Ensure only the legitimate document owner can decrypt and access their files.",
      description:
        "Lit Protocol binds document decryption keys to the owner's EVM wallet address via on-chain access control conditions. Optional time-bounded share links grant temporary access without exposing raw keys.",
      tech: "Lit Protocol SDK • EVM Access Conditions • Time Locks",
    },
    {
      id: 3,
      icon: Globe,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
      title: "3. 🌐 Decentralized Storage",
      tagline: "Avoid relying entirely on centralized cloud storage by using Lighthouse/IPFS and Filecoin.",
      description:
        "Encrypted documents (.enc) and cryptographic manifests are pinned to decentralized IPFS nodes with Filecoin persistent storage deals via the official Lighthouse Web3 SDK.",
      tech: "Lighthouse Web3 • IPFS Content Addressing • Filecoin Storage Deals",
    },
    {
      id: 4,
      icon: Link,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800",
      title: "4. ⛓️ Blockchain Integrity",
      tagline: "Store document CIDs, hashes, ownership, and timestamps on-chain so integrity can be verified.",
      description:
        "Sepolia smart contracts record immutable document registrations: manifestCID, raw file SHA-256 hash, manifest hash, owner wallet address, block timestamps, and state flags.",
      tech: "Solidity 0.8.20 • Sepolia Testnet • ERC-712 Meta-TX Ready",
    },
    {
      id: 5,
      icon: Cpu,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800",
      title: "5. 🤖 AI-Powered Analysis",
      tagline: "Use Chainlink CRE to extract metadata and generate a document risk score.",
      description:
        "Chainlink Consensus Runtime Environment (CRE) paired with Google Gemini analyzes document structure, extracts sensitivity tags, detects PII/compliance factors, and computes an automated risk score (0-100).",
      tech: "Chainlink CRE • Gemini 2.5/Flash • Consensus Attestations",
    },
    {
      id: 6,
      icon: ShieldAlert,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800",
      title: "6. 🛡️ Tamper Detection",
      tagline: "Use cryptographic hashes to detect whether stored document or metadata has been altered.",
      description:
        "Upon downloading or viewing, the browser recalculates the SHA-256 byte hash and verifies it against the on-chain smart contract record to detect tampering or corruption.",
      tech: "SHA-256 Digest • Byte-Level Verification • On-Chain Oracle Cross-Check",
    },
    {
      id: 7,
      icon: FolderLock,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800",
      title: "7. 📂 User-Controlled Document Vault",
      tagline: "Give users a decentralized way to upload, manage, verify, and download their own documents.",
      description:
        "A self-sovereign interface providing multi-category organization, cryptographic link sharing, risk telemetry charts, custom Lighthouse API key management, and permanent or soft deletion controls.",
      tech: "React 18 • Tailwind CSS • Web3 Wallet • Firebase Firestore Mirror",
    },
  ];

  const workflowSteps = [
    {
      step: 1,
      title: "Client-Side Encryption",
      desc: "User selects a document. The browser generates a random 256-bit AES key and encrypts the file into ciphertext locally.",
      badge: "Local Browser",
    },
    {
      step: 2,
      title: "AI Analysis & Risk Score",
      desc: "Chainlink CRE / Gemini engine extracts metadata, PII tags, and produces a consensus risk score (0-100).",
      badge: "CRE + AI",
    },
    {
      step: 3,
      title: "Decentralized Storage Pinning",
      desc: "The encrypted file and Lit manifest are uploaded to Lighthouse IPFS nodes with persistent Filecoin deals.",
      badge: "Lighthouse / IPFS",
    },
    {
      step: 4,
      title: "On-Chain Smart Contract Mint",
      desc: "CID, file SHA-256 hash, owner address, and timestamp are minted immutably to the Sepolia smart contract.",
      badge: "Ethereum / EVM",
    },
    {
      step: 5,
      title: "Lit Access Control Sealing",
      desc: "The AES decryption key is sealed with Lit Protocol access conditions requiring the owner's EVM wallet signature.",
      badge: "Lit Protocol",
    },
    {
      step: 6,
      title: "Decryption & Tamper Verification",
      desc: "Owner authenticates via wallet, unseals the key, verifies the on-chain hash, and decrypts the plaintext in-browser.",
      badge: "Verified Download",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>BlockNDrive — Project Overview & Architecture</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Decentralized, Intelligent, and User-Controlled Digital Document Vault
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Overview & Mission</span>
          </button>

          <button
            onClick={() => setActiveTab("goals")}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "goals"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>7 Main Goals</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
              7/7
            </span>
          </button>

          <button
            onClick={() => setActiveTab("architecture")}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "architecture"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Cryptographic Workflow</span>
          </button>

          <button
            onClick={() => setActiveTab("specs")}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "specs"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <Database className="h-4 w-4" />
            <span>Smart Contracts & Nodes</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Mission Hero Quote */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-emerald-500/10 border border-indigo-200 dark:border-indigo-800/60 relative overflow-hidden">
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">
                  Core Mission Statement
                </span>
                <blockquote className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white mt-1 leading-relaxed">
                  "BlockNDrive aims to build a secure, decentralized, and intelligent digital document vault where users—not a centralized server—remain in control of their documents and access."
                </blockquote>
              </div>

              {/* Comprehensive Summary */}
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
                <p>
                  <strong>BlockNDrive</strong> is a decentralized document vault designed to securely store, protect, and manage users’ important documents using <strong>blockchain</strong>, <strong>encryption</strong>, <strong>decentralized storage</strong>, <strong>AI</strong>, and <strong>access control</strong>.
                </p>
                <p>
                  When a user uploads a document, it is first encrypted locally using <strong>AES</strong>, so the plaintext document is never sent to storage. The encrypted file is then uploaded to <strong>Lighthouse/IPFS</strong> with <strong>Filecoin-backed storage</strong>, while its CID, hashes, owner information, and timestamps are recorded on a blockchain smart contract.
                </p>
                <p>
                  <strong>Chainlink CRE</strong> processes document metadata, extracts useful information, generates an AI-based risk score, and stores the resulting data/hash. <strong>Lit Protocol</strong> provides the access-control layer so that only the authorized document owner can obtain the key needed to decrypt and download the document.
                </p>
              </div>

              {/* 7 Goals Quick Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {goals.map((g) => {
                  const Icon = g.icon;
                  return (
                    <div
                      key={g.id}
                      onClick={() => setActiveTab("goals")}
                      className={`p-3.5 rounded-xl border ${g.bgColor} transition cursor-pointer hover:shadow-xs flex items-start gap-3`}
                    >
                      <div className={`p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 ${g.color} shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {g.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                          {g.tagline}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: 7 MAIN GOALS */}
          {activeTab === "goals" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  The 7 Pillars of BlockNDrive
                </h3>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  All 7 Fully Implemented & Live
                </span>
              </div>

              <div className="space-y-3">
                {goals.map((g) => {
                  const Icon = g.icon;
                  return (
                    <div
                      key={g.id}
                      className={`p-4 rounded-xl border ${g.bgColor} transition space-y-2`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg bg-white dark:bg-slate-900 ${g.color} shrink-0 shadow-xs`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {g.title}
                            </h4>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              {g.tagline}
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-current/20 shrink-0">
                          Goal #{g.id}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 pl-11">
                        {g.description}
                      </p>

                      <div className="pl-11 pt-1 flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                          Tech Stack:
                        </span>
                        <code className="text-[10px] font-mono bg-white/60 dark:bg-slate-900/60 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          {g.tech}
                        </code>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CRYPTOGRAPHIC WORKFLOW */}
          {activeTab === "architecture" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  End-to-End Cryptographic Lifecycle
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  How a document moves from your local device into decentralized storage and smart contracts.
                </p>
              </div>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {workflowSteps.map((s) => (
                  <div
                    key={s.step}
                    className="relative flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ml-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md ring-4 ring-white dark:ring-slate-900 z-10">
                      {s.step}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {s.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {s.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SPECS & CONTRACTS */}
          {activeTab === "specs" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Deployment Artifacts & Endpoints
              </h3>

              <div className="space-y-3">
                {/* Smart Contract Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Link className="h-4 w-4 text-purple-600" />
                      <span>Sepolia Document Vault Smart Contract</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      EVM Verified
                    </span>
                  </div>
                  <code className="text-[11px] font-mono block p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 break-all border border-slate-200 dark:border-slate-800">
                    {BLOCKNDRIVE_CONTRACT_ADDRESS}
                  </code>
                  <a
                    href={`https://sepolia.etherscan.io/address/${BLOCKNDRIVE_CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    <span>View on Sepolia Etherscan</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Chainlink CRE Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Cpu className="h-4 w-4 text-cyan-600" />
                      <span>Chainlink CRE Consensus Oracle Forwarder</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
                      CRE Active
                    </span>
                  </div>
                  <code className="text-[11px] font-mono block p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 break-all border border-slate-200 dark:border-slate-800">
                    {CRE_FORWARDER_ADDRESS}
                  </code>
                  <div className="flex items-center gap-3 pt-1">
                    {onOpenCREModal && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenCREModal();
                        }}
                        className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Chainlink CRE Consensus Inspector</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Lighthouse IPFS Storage */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Server className="h-4 w-4 text-emerald-600" />
                      <span>Lighthouse Decentralized IPFS Storage Node</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Filecoin Deals
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Host: <code className="font-mono">node.lighthouse.storage</code> • Gateway: <code className="font-mono">gateway.lighthouse.storage/ipfs/</code>
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    {onOpenLighthouseDiagnostics && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenLighthouseDiagnostics();
                        }}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Run 5-Step Node Diagnostic Utility</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-600" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              BlockNDrive Vault Protocol
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
