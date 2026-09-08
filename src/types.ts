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

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  networkName: string;
  balance: string | null;
  isMetaMaskAvailable: boolean;
  isDemoMode: boolean;
}
