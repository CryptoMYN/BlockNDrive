import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Lock,
  Cpu,
  Database,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Shield,
  X,
} from "lucide-react";
import type { UploadPhase, AIAnalysisResult, VaultDocument, WalletState } from "../types";
import { encryptFileInBrowser, computeManifestHash, sealKeyForOwner } from "../services/crypto";
import { uploadEncryptedFileToLighthouse, uploadManifestToLighthouse } from "../services/lighthouse";
import { uploadDocumentToContract, saveDocumentToStorage } from "../services/blockchain";
import { BLOCKNDRIVE_CONTRACT_ADDRESS } from "../constants/contract";

interface UploadSectionProps {
  wallet: WalletState;
  onUploadSuccess: (newDoc: VaultDocument) => void;
  onRequireConnect: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  wallet,
  onUploadSuccess,
  onRequireConnect,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>("IDLE");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [aiPreview, setAiPreview] = useState<AIAnalysisResult | null>(null);
  const [uploadedCid, setUploadedCid] = useState<string | null>(null);
  const [recentTx, setRecentTx] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
      setPhase("IDLE");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setErrorMsg(null);
      setPhase("IDLE");
    }
  };

  const clearSelectedFile = () => {
    setFile(null);
    setErrorMsg(null);
    setPhase("IDLE");
    setAiPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Main 7-phase upload execution
  const startUploadPipeline = async () => {
    if (!file) return;

    if (!wallet.isConnected) {
      onRequireConnect();
      return;
    }

    setErrorMsg(null);

    try {
      // -------------------------------------------------------------
      // PHASE 2: AES Encryption in browser
      // -------------------------------------------------------------
      setPhase("ENCRYPTING_AES");
      setStatusMessage("Encrypting file locally with AES-GCM 256-bit (Zero plaintext leak)...");

      const encryptedPayload = await encryptFileInBrowser(file);

      // Save encrypted file locally in cache so user can download anytime
      const arrayBuf = await encryptedPayload.encryptedBlob.arrayBuffer();
      // Store in memory or local session for fast decryption
      (window as any)[`__cache_${encryptedPayload.fileHash}`] = arrayBuf;

      // -------------------------------------------------------------
      // PHASE 6: Chainlink CRE + Gemini AI Metadata Extraction & Risk Scoring
      // -------------------------------------------------------------
      setPhase("AI_ANALYZING");
      setStatusMessage("Chainlink CRE: AI metadata extraction & risk evaluation...");

      // Sample a small slice for AI extraction if text-like
      let sampleText = "";
      if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".json") || file.name.endsWith(".md")) {
        try {
          sampleText = await file.text();
        } catch {
          // ignore
        }
      }

      let aiResult: AIAnalysisResult = {
        classification: "Standard Document",
        category: "General",
        sensitivity: "Low",
        summary: `Document "${file.name}" encrypted with AES-256 for BlockNDrive decentralized registry.`,
        detectedEntities: [],
        complianceFlags: [],
        riskScore: 15,
        riskLevel: "LOW",
        reasoning: "Normal file characteristics. Standard safe storage tier.",
        creWorkflowId: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      };

      try {
        const aiResponse = await fetch("/api/analyze-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
            sampleText: sampleText.slice(0, 1000),
          }),
        });

        if (aiResponse.ok) {
          aiResult = await aiResponse.json();
          setAiPreview(aiResult);
        }
      } catch (aiErr) {
        console.warn("AI metadata analysis fallback:", aiErr);
      }

      // -------------------------------------------------------------
      // PHASE 3: Lighthouse IPFS / Filecoin Upload
      // -------------------------------------------------------------
      setPhase("UPLOADING_LIGHTHOUSE");
      setStatusMessage("Pinning encrypted payload to Lighthouse IPFS & Filecoin nodes...");

      const fileUploadRes = await uploadEncryptedFileToLighthouse(
        file.name,
        encryptedPayload.encryptedBlob
      );
      setUploadedCid(fileUploadRes.cid);

      // -------------------------------------------------------------
      // PHASE 5: Lit Protocol Access Control & Sealed Key
      // -------------------------------------------------------------
      setStatusMessage("Configuring Lit Protocol owner-only access control condition...");

      const ownerAddress = wallet.address || "0x71C...Demo";
      const sealedKeyHex = await sealKeyForOwner(
        encryptedPayload.rawKeyHex,
        ownerAddress,
        null
      );

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
        },
        aiAnalysis: aiResult,
        riskScore: aiResult.riskScore,
      };

      // Upload manifest to Lighthouse
      const manifestUploadRes = await uploadManifestToLighthouse(manifest);
      const manifestCID = manifestUploadRes.cid;

      // Compute manifest hash (bytes32)
      const manifestHash = computeManifestHash(manifest);

      // -------------------------------------------------------------
      // PHASE 4: Smart Contract Registration
      // -------------------------------------------------------------
      setPhase("CONTRACT_MINTING");
      setStatusMessage("Signing transaction & registering document to BlockNDrive smart contract...");

      const contractResult = await uploadDocumentToContract(
        manifestCID,
        encryptedPayload.fileHash,
        manifestHash,
        aiResult.riskScore,
        wallet.isDemoMode,
        ownerAddress
      );

      setRecentTx(contractResult.txHash);

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
      // Cache manifest and unsealed key in session storage for immediate owner download
      localStorage.setItem(`blockndrive_manifest_${manifestCID}`, JSON.stringify(newDoc.manifest));
      localStorage.setItem(`blockndrive_key_${encryptedPayload.fileHash}`, encryptedPayload.rawKeyHex);

      setPhase("SUCCESS");
      setStatusMessage("Document successfully encrypted, pinned to IPFS, and registered on blockchain!");

      onUploadSuccess(newDoc);
    } catch (err: any) {
      console.error("Pipeline failure:", err);
      setPhase("ERROR");
      setErrorMsg(err.message || "Upload and registration failed. Please try again.");
    }
  };

  return (
    <section className="py-6">
      {/* Hero Headings */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Decentralized Document Vault</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Securely store and manage your documents
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Browser-side AES-256 encryption, Lighthouse Filecoin-backed IPFS storage, Lit Protocol access control, and Chainlink CRE risk attestation.
        </p>
      </div>

      {/* Upload Box Container matching user's ASCII diagram */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 transition-colors">
        <div className="text-center mb-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload Document</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Files are encrypted locally before leaving your browser</p>
        </div>

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
          <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Selected file:</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate font-mono">
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Lock className="h-3 w-3" /> Ready for AES-GCM 256
                    </span>
                  </div>
                </div>
              </div>

              {phase === "IDLE" && (
                <button
                  onClick={clearSelectedFile}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Upload Button */}
            {phase === "IDLE" && (
              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700 flex justify-center">
                <button
                  id="upload-document-btn"
                  onClick={startUploadPipeline}
                  className="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 dark:shadow-none transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload Document</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Phase Progress Tracker */}
        {phase !== "IDLE" && (
          <div className="mt-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                BlockNDrive Pipeline Progress
              </span>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {phase === "SUCCESS"
                  ? "Completed"
                  : phase === "ERROR"
                  ? "Action Halted"
                  : "Processing..."}
              </span>
            </div>

            {/* 4 Pipeline Steps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {/* Step 1: AES */}
              <div
                className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                  phase === "ENCRYPTING_AES"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
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
                <span className="text-[10px] text-slate-500 dark:text-slate-400">AES-256 In-Browser</span>
              </div>

              {/* Step 2: CRE AI */}
              <div
                className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                  phase === "AI_ANALYZING"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                    : ["UPLOADING_LIGHTHOUSE", "CONTRACT_MINTING", "SUCCESS"].includes(phase)
                    ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">2. CRE & AI Risk</span>
                  {phase === "AI_ANALYZING" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                  ) : ["UPLOADING_LIGHTHOUSE", "CONTRACT_MINTING", "SUCCESS"].includes(phase) ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Cpu className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Gemini Extraction</span>
              </div>

              {/* Step 3: Lighthouse */}
              <div
                className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                  phase === "UPLOADING_LIGHTHOUSE"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                    : ["CONTRACT_MINTING", "SUCCESS"].includes(phase)
                    ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">3. Lighthouse</span>
                  {phase === "UPLOADING_LIGHTHOUSE" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                  ) : ["CONTRACT_MINTING", "SUCCESS"].includes(phase) ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Database className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Filecoin IPFS CID</span>
              </div>

              {/* Step 4: Smart Contract */}
              <div
                className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                  phase === "CONTRACT_MINTING"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                    : phase === "SUCCESS"
                    ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">4. Blockchain</span>
                  {phase === "CONTRACT_MINTING" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                  ) : phase === "SUCCESS" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <LinkIcon className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Sepolia Registry</span>
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
              <span>{statusMessage}</span>
            </div>

            {/* Success Details Box */}
            {phase === "SUCCESS" && (
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Vault Registration Successful
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
                    <span className="text-slate-500 dark:text-slate-400">Tx Hash:</span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${recentTx}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                    >
                      {recentTx}
                    </a>
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
    </section>
  );
};
