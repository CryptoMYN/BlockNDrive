import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  File,
  Lock,
  Cpu,
  Database,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  Fuel,
  Wallet,
  Zap,
  Clock,
  Wifi,
} from "lucide-react";
import type {
  VaultDocument,
  UploadPhase,
  AIAnalysisResult,
  WalletState,
  UploadPerformanceMetrics,
} from "../types";
import { encryptFileAES } from "../services/crypto";
import { analyzeDocumentWithCRE } from "../services/chainlinkCRE";
import {
  uploadEncryptedFileToLighthouse,
  uploadManifestToLighthouse,
  verifyLighthouseUploadConfirmation,
} from "../services/lighthouse";
import { sealKeyForOwner, computeManifestHash } from "../services/lit";
import {
  uploadDocumentToContract,
  saveDocumentToStorage,
} from "../services/blockchain";
import {
  UploadPerformanceTracker,
  formatBytes,
  formatDuration,
} from "../services/performanceTracker";
import { BLOCKNDRIVE_CONTRACT_ADDRESS } from "../constants/contract";
import { auth, seedInitialAuditLogsIfEmpty } from "../lib/firebase";
import { LighthouseStatusIndicator } from "./LighthouseStatusIndicator";
import { LighthouseStorageManagerModal } from "./LighthouseStorageManagerModal";
import { UploadPerformanceMetricsCard } from "./UploadPerformanceMetricsCard";

interface UploadSectionProps {
  wallet: WalletState;
  onUploadSuccess: (doc: VaultDocument) => void;
  onRequireConnect?: () => void;
  onOpenFaucetModal?: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  wallet,
  onUploadSuccess,
  onRequireConnect,
  onOpenFaucetModal,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [phase, setPhase] = useState<UploadPhase>("IDLE");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadedCid, setUploadedCid] = useState<string | null>(null);
  const [recentTx, setRecentTx] = useState<string | null>(null);
  const [aiPreview, setAiPreview] = useState<AIAnalysisResult | null>(null);
  const [showLighthouseModal, setShowLighthouseModal] = useState<boolean>(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<UploadPerformanceMetrics | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | undefined>(undefined);
  const [elapsedTimer, setElapsedTimer] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const trackerRef = useRef<UploadPerformanceTracker | null>(null);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (phase !== "IDLE" && phase !== "SUCCESS" && phase !== "ERROR") {
      const start = performance.now();
      timerIntervalRef.current = setInterval(() => {
        setElapsedTimer(Math.round((performance.now() - start) / 100) / 10);
      }, 100);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [phase]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setErrorMsg(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const clearSelectedFile = () => {
    setFile(null);
    setPhase("IDLE");
    setStatusMessage("");
    setErrorMsg(null);
    setUploadedCid(null);
    setRecentTx(null);
    setAiPreview(null);
    setPerformanceMetrics(null);
    setActiveStepId(undefined);
    setElapsedTimer(0);
    trackerRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isWalletReady = wallet.isConnected && !!wallet.address;
  const hasZeroBalance = isWalletReady && (wallet.balance === "0.0000" || wallet.balance === "0" || !wallet.balance);

  // -----------------------------------------------------------------
  // 5-PHASE STRICT ON-CHAIN GAS TIER UPLOAD PIPELINE WITH TELEMETRY
  // -----------------------------------------------------------------
  const startUploadPipeline = async () => {
    if (!file) {
      setErrorMsg("Please select a file to upload.");
      return;
    }

    if (!isWalletReady) {
      if (onRequireConnect) {
        onRequireConnect();
      } else {
        setErrorMsg("MetaMask connection is required on On-Chain Gas Tier.");
      }
      return;
    }

    if (hasZeroBalance) {
      setErrorMsg(
        "Your Sepolia wallet balance is 0.0000 ETH. On-Chain Gas Tier requires a fraction of free Sepolia ETH for network gas. Click 'Claim Free Gas' below to get testnet tokens in seconds."
      );
      return;
    }

    setErrorMsg(null);
    setUploadedCid(null);
    setRecentTx(null);
    setElapsedTimer(0);

    // Initialize Performance Tracker
    const tracker = new UploadPerformanceTracker(
      file.size,
      file.name,
      (updatedMetrics, activeStep) => {
        setPerformanceMetrics(updatedMetrics);
        if (activeStep) {
          setActiveStepId(activeStep.id);
        }
      }
    );
    trackerRef.current = tracker;

    try {
      // -------------------------------------------------------------
      // PHASE 1: Client-Side AES-256-GCM Encryption
      // -------------------------------------------------------------
      setPhase("ENCRYPTING_AES");
      setStatusMessage("Generating cryptographic key & encrypting file locally via Web Crypto AES-GCM-256...");
      tracker.startStep(
        "aes_encryption",
        "AES-256-GCM Local Encryption",
        "crypto",
        "Generating 256-bit AES key & 96-bit IV. Encrypting locally in browser..."
      );

      const encryptedPayload = await encryptFileAES(file);
      tracker.endStep(
        "aes_encryption",
        file.size,
        `Generated ${formatBytes(encryptedPayload.encryptedBlob.size)} ciphertext locally (${encryptedPayload.performanceStats?.throughputFormatted || "Fast"})`
      );
      console.log(`[Upload Pipeline] AES-GCM-256 encryption complete for: ${file.name}`);

      // -------------------------------------------------------------
      // PHASE 2: Chainlink CRE AI Risk Scoring
      // -------------------------------------------------------------
      setPhase("AI_ANALYZING");
      setStatusMessage("Dispatching document to Chainlink CRE AI for cryptographic risk scoring...");
      tracker.startStep(
        "chainlink_cre_ai",
        "Chainlink CRE AI Risk Scoring",
        "ai",
        "Evaluating document structure, sensitivity, and credential exposure..."
      );

      let textSample = "";
      if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".json")) {
        try {
          textSample = await file.text();
        } catch {
          // ignore
        }
      }

      const aiResult: AIAnalysisResult = await analyzeDocumentWithCRE(
        file.name,
        file.size,
        file.type,
        textSample
      );
      setAiPreview(aiResult);
      tracker.endStep(
        "chainlink_cre_ai",
        undefined,
        `Risk assessed: ${aiResult.riskScore}/100 • Category: ${aiResult.category} (${aiResult.sensitivity} sensitivity)`
      );
      console.log(`[Upload Pipeline] Chainlink CRE score: ${aiResult.riskScore}/100`);

      // -------------------------------------------------------------
      // PHASE 3: Lighthouse IPFS / Filecoin Upload
      // -------------------------------------------------------------
      setPhase("UPLOADING_LIGHTHOUSE");
      setStatusMessage("Streaming encrypted payload chunks to Lighthouse IPFS & Filecoin nodes...");
      tracker.startStep(
        "ipfs_upload",
        "Lighthouse IPFS & Filecoin Upload",
        "storage",
        `Uploading ${formatBytes(encryptedPayload.encryptedBlob.size)} encrypted payload to IPFS...`
      );

      const fileUploadRes = await uploadEncryptedFileToLighthouse(
        file.name,
        encryptedPayload.encryptedBlob
      );
      setUploadedCid(fileUploadRes.cid);
      tracker.endStep(
        "ipfs_upload",
        encryptedPayload.encryptedBlob.size,
        `Pinned to IPFS CID: ${fileUploadRes.cid.slice(0, 14)}... (${fileUploadRes.performanceStats?.throughputFormatted || "Uploaded"})`
      );
      console.log(`[Upload Pipeline] Encrypted payload pinned to IPFS CID: ${fileUploadRes.cid}`);

      // Verify node receipt
      setStatusMessage("Verifying storage node receipt & IPFS confirmation...");
      tracker.startStep(
        "ipfs_verify",
        "IPFS Node Receipt & Gateway Probe",
        "network",
        "Checking multi-gateway resolution and storage node persistence..."
      );
      await verifyLighthouseUploadConfirmation(
        fileUploadRes.cid,
        `${file.name}.enc`,
        encryptedPayload.encryptedBlob.size
      );
      tracker.endStep(
        "ipfs_verify",
        undefined,
        "Storage confirmation verified across decentralized gateway cluster"
      );

      // -------------------------------------------------------------
      // PHASE 4: Lit Protocol Access Control & Sealed Key
      // -------------------------------------------------------------
      setStatusMessage("Configuring Lit Protocol owner-only access condition...");
      tracker.startStep(
        "lit_key_sealing",
        "Lit Protocol Key Encapsulation",
        "access_control",
        "Encapsulating symmetric AES key with on-chain EVM conditional rules..."
      );

      const ownerAddress = wallet.address!;
      const sealedKeyHex = await sealKeyForOwner(
        encryptedPayload.rawKeyHex,
        ownerAddress,
        null
      );
      tracker.endStep(
        "lit_key_sealing",
        undefined,
        "Owner-only access conditions locked for wallet address"
      );

      // -------------------------------------------------------------
      // PHASE 4b: Cryptographic Manifest Pinning
      // -------------------------------------------------------------
      tracker.startStep(
        "manifest_upload",
        "Cryptographic Manifest IPFS Pin",
        "storage",
        "Building gas-efficient manifest and pinning JSON to IPFS..."
      );

      // Get intermediate performance metrics to include inside the manifest
      const interimMetrics = tracker.getMetrics();

      // Build gas-efficient Manifest JSON
      const manifest = {
        version: 1,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        fileCID: fileUploadRes.cid,
        fileHash: encryptedPayload.fileHash,
        iv: encryptedPayload.ivHex,
        encryptedKey: sealedKeyHex,
        accessControl: {
          protocol: "lit-protocol-evm-access" as const,
          version: "1.0.0" as const,
          chain: "sepolia",
          contractAddress: BLOCKNDRIVE_CONTRACT_ADDRESS,
          ownerAddress: ownerAddress,
          condition: {
            conditionType: "evmBasic" as const,
            contractAddress: BLOCKNDRIVE_CONTRACT_ADDRESS,
            standardContractType: "Custom" as const,
            chain: "sepolia" as const,
            method: "isOwner" as const,
            parameters: ["pending"] as [string],
            returnValueTest: {
              comparator: "=" as const,
              value: "true" as const,
            },
          },
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalName: file.name,
          encryptionAlgorithm: "AES-GCM-256" as const,
          storageProvider: "Lighthouse (Filecoin/IPFS)" as const,
          performanceMetrics: interimMetrics,
        },
        aiAnalysis: aiResult,
        riskScore: aiResult.riskScore,
      };

      // Upload manifest to Lighthouse
      setStatusMessage("Pinning cryptographic manifest to Lighthouse IPFS...");
      const manifestUploadRes = await uploadManifestToLighthouse(manifest);
      const manifestCID = manifestUploadRes.cid;

      // Verify manifest CID on IPFS node
      await verifyLighthouseUploadConfirmation(
        manifestCID,
        `manifest_${file.name}.json`
      );
      tracker.endStep(
        "manifest_upload",
        JSON.stringify(manifest).length,
        `Manifest CID: ${manifestCID.slice(0, 14)}...`
      );

      // Compute manifest hash (bytes32)
      const manifestHash = computeManifestHash(manifest);

      // -------------------------------------------------------------
      // PHASE 5: Real On-Chain Smart Contract Registration (Gas Tier)
      // -------------------------------------------------------------
      setPhase("CONTRACT_MINTING");
      setStatusMessage("Confirm transaction in MetaMask: Broadcasting to Ethereum Sepolia smart contract with gas...");
      tracker.startStep(
        "contract_minting",
        "Ethereum Sepolia Smart Contract Registry",
        "blockchain",
        "Submitting gas transaction via MetaMask and awaiting block confirmation..."
      );

      const contractResult = await uploadDocumentToContract(
        manifestCID,
        encryptedPayload.fileHash,
        manifestHash,
        aiResult.riskScore
      );
      console.log(`[Upload Pipeline] On-chain smart contract confirmed! Tx: ${contractResult.txHash}, Doc ID: ${contractResult.documentId}`);

      setRecentTx(contractResult.txHash);
      tracker.endStep(
        "contract_minting",
        undefined,
        `Confirmed on Sepolia in Doc #${contractResult.documentId} (Tx: ${contractResult.txHash.slice(0, 10)}...)`
      );

      const finalPerformanceMetrics = tracker.getMetrics();
      setPerformanceMetrics(finalPerformanceMetrics);
      setActiveStepId(undefined);

      // Complete Document Object
      const newDoc: VaultDocument = {
        id: contractResult.documentId,
        owner: ownerAddress,
        manifestCID,
        fileHash: encryptedPayload.fileHash,
        manifestHash,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        riskScore: aiResult.riskScore,
        deleted: false,
        txHash: contractResult.txHash,
        manifest: {
          ...manifest,
          metadata: {
            ...manifest.metadata,
            performanceMetrics: finalPerformanceMetrics,
          },
          accessControl: {
            ...manifest.accessControl,
            condition: {
              ...manifest.accessControl.condition,
              parameters: [contractResult.documentId.toString()],
            },
          },
        },
      };

      // Store in persistence
      saveDocumentToStorage(newDoc);
      localStorage.setItem(`blockndrive_manifest_${manifestCID}`, JSON.stringify(newDoc.manifest));
      localStorage.setItem(`blockndrive_key_${encryptedPayload.fileHash}`, encryptedPayload.rawKeyHex);

      // Seed initial cryptographic audit trail in Firestore
      seedInitialAuditLogsIfEmpty(newDoc, auth.currentUser?.uid || wallet.address).catch((err) =>
        console.warn("Could not seed initial audit logs:", err)
      );

      setPhase("SUCCESS");
      setStatusMessage("Document successfully encrypted, pinned to IPFS, and permanently registered on Ethereum Sepolia!");

      onUploadSuccess(newDoc);
    } catch (err: any) {
      console.error("Pipeline failure:", err);
      if (trackerRef.current && activeStepId) {
        trackerRef.current.failStep(activeStepId, err.message || "Step failed");
      }
      setPhase("ERROR");
      setErrorMsg(err.message || "Upload and on-chain registration failed. Please try again.");
    }
  };

  const step1Timing = performanceMetrics?.steps.find((s) => s.id === "aes_encryption");
  const step2Timing = performanceMetrics?.steps.find((s) => s.id === "chainlink_cre_ai");
  const step3Timing = performanceMetrics?.steps.find((s) => s.id === "ipfs_upload");
  const step4Timing = performanceMetrics?.steps.find((s) => s.id === "contract_minting");

  return (
    <section className="py-6">
      {/* Hero Headings */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          <span>On-Chain Gas Tier Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Securely store and register documents on-chain
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Client-side AES-256 encryption, Lighthouse Filecoin/IPFS storage, Lit Protocol access control, and live Ethereum Sepolia smart contract attestation with real-time performance telemetry.
        </p>
      </div>

      {/* Upload Box Container */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-5">
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload & Register Document</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Encrypted locally in browser & attested on Sepolia smart contract</p>
          </div>
          <LighthouseStatusIndicator
            onClick={() => setShowLighthouseModal(true)}
            variant="badge"
          />
        </div>

        {/* On-Chain Gas Tier Wallet Status Banner */}
        {!isWalletReady ? (
          <div className="mb-5 p-3.5 rounded-xl border bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="text-lg leading-none mt-0.5">🦊</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    MetaMask Connection Required (On-Chain Gas Tier)
                  </span>
                </div>
                <p className="text-amber-800/90 dark:text-amber-300/90 text-[11px] mt-0.5 leading-relaxed">
                  All documents require cryptographic MetaMask signatures and on-chain Sepolia smart contract registration.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="connect-metamask-upload-banner-btn"
              onClick={onRequireConnect}
              className="shrink-0 w-full sm:w-auto px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <span>Connect MetaMask</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="mb-5 p-3.5 rounded-xl border bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">
                    On-Chain Gas Tier Active
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-mono">
                    Sepolia Contract Verified
                  </span>
                </div>
                <p className="text-emerald-800/90 dark:text-emerald-300/90 text-[11px] mt-0.5">
                  Wallet: <code className="font-mono">{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</code> • Balance: <span className="font-semibold">{wallet.balance || "0.0000"} ETH</span>
                </p>
              </div>
            </div>

            {hasZeroBalance ? (
              <a
                href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Get free Sepolia testnet ETH for gas"
              >
                <Fuel className="h-3 w-3" />
                <span>Get Free Gas (Faucet)</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Gas Ready
              </span>
            )}
          </div>
        )}

        {/* Drag & Drop Zone */}
        <div
          id="dropzone-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 scale-[0.99]"
              : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload-input"
          />

          <div className="flex flex-col items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Drag & drop your file here
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">or</p>
            </div>
            <button
              type="button"
              id="choose-file-btn"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              Choose File
            </button>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Supports PDF, DOCX, TXT, PNG, JPG, JSON (Max 50MB)
            </p>
          </div>
        </div>

        {/* Selected File Card */}
        {file && (
          <div className="mt-5 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <File className="h-5 w-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatBytes(file.size)} • {file.type || "Document"}
                  </p>
                </div>
              </div>
              <button
                id="clear-file-btn"
                onClick={clearSelectedFile}
                disabled={phase !== "IDLE" && phase !== "SUCCESS" && phase !== "ERROR"}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition disabled:opacity-30 cursor-pointer"
                title="Remove selected file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Zero Balance Helper Banner */}
            {hasZeroBalance && phase === "IDLE" && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    <strong>Wallet Balance: 0.0000 ETH.</strong> Sepolia gas is required for on-chain smart contract registration.
                  </span>
                </div>
                {onOpenFaucetModal && (
                  <button
                    id="upload-faucet-guide-btn"
                    onClick={onOpenFaucetModal}
                    className="w-full sm:w-auto px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
                  >
                    <Fuel className="h-3 w-3" />
                    <span>Claim Free Gas</span>
                  </button>
                )}
              </div>
            )}

            {/* Upload Action Button */}
            {phase === "IDLE" && (
              <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Encrypted in browser, pinned to IPFS, and permanently registered on Sepolia.</span>
                </div>
                <button
                  id="upload-document-btn"
                  onClick={startUploadPipeline}
                  className="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 dark:shadow-none transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload & Broadcast On-Chain</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Phase Progress Tracker with Live Timing Telemetry */}
        {phase !== "IDLE" && (
          <div className="mt-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  On-Chain Pipeline Execution
                </span>
                {phase !== "SUCCESS" && phase !== "ERROR" && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                    <Clock className="h-3 w-3 animate-spin" />
                    <span>{elapsedTimer}s</span>
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {phase === "SUCCESS"
                  ? "Completed on Sepolia"
                  : phase === "ERROR"
                  ? "Action Halted"
                  : "Broadcasting..."}
              </span>
            </div>

            {/* 4 Pipeline Steps with Granular Timing Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {/* Step 1: AES */}
              <div
                className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                  phase === "ENCRYPTING_AES"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-2xs"
                    : ["AI_ANALYZING", "UPLOADING_LIGHTHOUSE", "CONTRACT_MINTING", "SUCCESS"].includes(
                        phase
                      )
                    ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">1. AES Encrypt</span>
                  {phase === "ENCRYPTING_AES" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                  ) : ["AI_ANALYZING", "UPLOADING_LIGHTHOUSE", "CONTRACT_MINTING", "SUCCESS"].includes(
                      phase
                    ) ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>AES-256</span>
                  {step1Timing?.durationMs ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatDuration(step1Timing.durationMs)}
                    </span>
                  ) : (
                    <span>Client</span>
                  )}
                </div>
              </div>

              {/* Step 2: CRE AI */}
              <div
                className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                  phase === "AI_ANALYZING"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-2xs"
                    : ["UPLOADING_LIGHTHOUSE", "CONTRACT_MINTING", "SUCCESS"].includes(phase)
                    ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">2. CRE AI Risk</span>
                  {phase === "AI_ANALYZING" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                  ) : ["UPLOADING_LIGHTHOUSE", "CONTRACT_MINTING", "SUCCESS"].includes(phase) ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Cpu className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Scoring</span>
                  {step2Timing?.durationMs ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatDuration(step2Timing.durationMs)}
                    </span>
                  ) : (
                    <span>DON Oracle</span>
                  )}
                </div>
              </div>

              {/* Step 3: Lighthouse IPFS Node Verified */}
              <div
                className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                  phase === "UPLOADING_LIGHTHOUSE"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-2xs"
                    : ["CONTRACT_MINTING", "SUCCESS"].includes(phase)
                    ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">3. Lighthouse IPFS</span>
                  {phase === "UPLOADING_LIGHTHOUSE" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                  ) : ["CONTRACT_MINTING", "SUCCESS"].includes(phase) ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Database className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Filecoin Node</span>
                  {step3Timing?.durationMs ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {step3Timing.throughputFormatted || formatDuration(step3Timing.durationMs)}
                    </span>
                  ) : (
                    <span>Pinning</span>
                  )}
                </div>
              </div>

              {/* Step 4: Smart Contract Immutable Proof */}
              <div
                className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                  phase === "CONTRACT_MINTING"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-2xs"
                    : phase === "SUCCESS"
                    ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">4. Sepolia Gas Tx</span>
                  {phase === "CONTRACT_MINTING" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                  ) : phase === "SUCCESS" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <LinkIcon className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>MetaMask Gas</span>
                  {step4Timing?.durationMs ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatDuration(step4Timing.durationMs)}
                    </span>
                  ) : (
                    <span>EVM Sign</span>
                  )}
                </div>
              </div>
            </div>

            {/* Current Status Message */}
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              {phase === "SUCCESS" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : phase === "ERROR" ? (
                <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              ) : (
                <Loader2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
              )}
              <span className="flex-1">{statusMessage}</span>
            </div>

            {/* Detailed Performance Timing Metrics Card */}
            {performanceMetrics && (
              <div className="pt-2">
                <UploadPerformanceMetricsCard
                  metrics={performanceMetrics}
                  fileName={file?.name}
                  isLive={phase !== "SUCCESS" && phase !== "ERROR"}
                  activeStepId={activeStepId}
                  onCopyReport={() => {
                    if (trackerRef.current) {
                      const text = trackerRef.current.generateReportText(performanceMetrics);
                      navigator.clipboard.writeText(text);
                    } else {
                      navigator.clipboard.writeText(JSON.stringify(performanceMetrics, null, 2));
                    }
                  }}
                />
              </div>
            )}

            {/* Success Details Box */}
            {phase === "SUCCESS" && (
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    On-Chain Smart Contract Registration Confirmed!
                  </span>
                  {aiPreview && (
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold ${
                        aiPreview.riskScore >= 80
                          ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                          : aiPreview.riskScore >= 50
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                          : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      Risk Score: {aiPreview.riskScore}/100
                    </span>
                  )}
                </div>

                {uploadedCid && (
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">IPFS CID:</span>
                    <a
                      href={`https://gateway.lighthouse.storage/ipfs/${uploadedCid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                    >
                      {uploadedCid}
                    </a>
                  </div>
                )}

                {recentTx && (
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">Sepolia Tx:</span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${recentTx}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                    >
                      {recentTx}
                    </a>
                    <ExternalLink className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={clearSelectedFile}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition cursor-pointer"
                  >
                    Upload Another Document
                  </button>
                </div>
              </div>
            )}

            {/* Error Message Display */}
            {phase === "ERROR" && errorMsg && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Execution Interrupted</p>
                  <p className="mt-0.5">{errorMsg}</p>
                </div>
                <button
                  onClick={() => setPhase("IDLE")}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lighthouse Storage & Diagnostics Modal */}
      <LighthouseStorageManagerModal
        isOpen={showLighthouseModal}
        onClose={() => setShowLighthouseModal(false)}
      />
    </section>
  );
};

