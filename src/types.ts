export interface DocumentMetadata {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
}

export interface EncryptedPayload {
  ivHex: string;
  fileHash: string; // 0x... bytes32
  encryptedBlob: Blob;
  encryptedBase64: string;
  rawKeyHex: string;
  performanceStats?: {
    durationMs: number;
    keyGenDurationMs: number;
    cipherDurationMs: number;
    hashDurationMs: number;
    throughputMBps: number;
    throughputFormatted: string;
  };
}

export interface AIAnalysisResult {
  classification: string;
  category: string;
  sensitivity: "Low" | "Medium" | "High" | "Critical";
  summary: string;
  detectedEntities: string[];
  complianceFlags: string[];
  riskScore: number; // 0 - 100
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  reasoning: string;
  creWorkflowId?: string;
}

export interface LitAccessControlConfig {
  protocol: "lit-protocol-evm-access";
  version: "1.0.0";
  chain: string;
  contractAddress: string;
  ownerAddress: string;
  condition: {
    conditionType: "evmBasic";
    contractAddress: string;
    standardContractType: "Custom";
    chain: "sepolia";
    method: "isOwner";
    parameters: [string];
    returnValueTest: {
      comparator: "=";
      value: "true";
    };
  };
}

export interface PerformanceStepMetric {
  id: string;
  name: string;
  category: "crypto" | "ai" | "storage" | "access_control" | "blockchain" | "network";
  startTime: number;
  endTime?: number;
  durationMs: number;
  bytesProcessed?: number;
  throughputMBps?: number;
  throughputFormatted?: string;
  details?: string;
  status: "pending" | "running" | "completed" | "warning" | "failed";
}

export type NetworkSpeedGrade = "ultra_fast" | "fast" | "moderate" | "slow" | "very_slow";

export interface UploadPerformanceMetrics {
  totalDurationMs: number;
  fileSizeBytes: number;
  encryptedSizeBytes: number;
  encryptionDurationMs: number;
  encryptionThroughputMBps: number;
  encryptionThroughputFormatted: string;
  ipfsUploadDurationMs: number;
  ipfsThroughputMBps: number;
  ipfsThroughputFormatted: string;
  ipfsVerificationDurationMs: number;
  aiAnalysisDurationMs: number;
  litSealingDurationMs: number;
  blockchainMiningDurationMs: number;
  networkGrade: NetworkSpeedGrade;
  networkGradeLabel: string;
  networkAdvice: string;
  steps: PerformanceStepMetric[];
  completedAt: number;
}

export interface ManifestData {
  version: number;
  name: string;
  mimeType: string;
  size: number;
  fileCID: string;
  fileHash: string; // bytes32
  iv: string;
  encryptedKey: string; // encrypted with owner wallet
  accessControl: LitAccessControlConfig;
  metadata: {
    uploadedAt: string;
    originalName: string;
    encryptionAlgorithm: "AES-GCM-256";
    storageProvider: "Lighthouse (Filecoin/IPFS)";
    performanceMetrics?: UploadPerformanceMetrics;
  };
  aiAnalysis: AIAnalysisResult;
  riskScore: number;
}

export interface VaultDocument {
  id: number;
  owner: string;
  manifestCID: string;
  fileHash: string;
  manifestHash: string;
  createdAt: number;
  updatedAt: number;
  riskScore: number;
  deleted: boolean;
  deletedAt?: number; // timestamp (ms) when moved to archive (24h retention)
  permanentlyDeleted?: boolean;
  manifest?: ManifestData;
  txHash?: string;
}

export type UploadPhase =
  | "IDLE"
  | "ENCRYPTING_AES"
  | "AI_ANALYZING"
  | "UPLOADING_LIGHTHOUSE"
  | "CONTRACT_MINTING"
  | "SUCCESS"
  | "ERROR";

export type AuditActionType =
  | "upload"
  | "encryption"
  | "metadata_analysis"
  | "blockchain_registry"
  | "lit_access_seal"
  | "access_grant"
  | "download_decryption"
  | "archive"
  | "restore";

export interface DocumentAuditLog {
  id: string;
  docId: number | string;
  fileHash: string;
  ownerId?: string | null;
  ownerAddress?: string | null;
  action: AuditActionType;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "failed";
  timestamp: string;
  timestampMs: number;
  actor: string;
  metadata?: {
    fileCID?: string;
    manifestCID?: string;
    riskScore?: number;
    riskLevel?: string;
    encryptionAlgorithm?: string;
    recipient?: string;
    grantDurationDays?: number;
    onChainTxHash?: string;
    network?: string;
    contractAddress?: string;
    fileSize?: number;
    mimeType?: string;
    [key: string]: any;
  };
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  networkName: string;
  balance: string | null;
  isMetaMaskAvailable: boolean;
}
