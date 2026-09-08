import type { ManifestData } from "../types";

export interface LighthouseUploadResponse {
  success: boolean;
  cid: string;
  name: string;
  size: number;
  storageProvider: string;
  gatewayUrl: string;
  externalGatewayUrl?: string;
  lighthouse?: {
    Name?: string;
    Hash?: string;
    Size?: string;
    synced?: boolean;
  };
  warning?: string;
}

export interface LighthouseStatusResponse {
  success: boolean;
  connected: boolean;
  dataLimit: number;
  dataUsed: number;
  totalFiles: number;
  apiKeyMasked: string;
  isCustom: boolean;
  storageProvider?: string;
  nodeStatus?: string;
  error?: string;
}

export interface LighthouseUploadedFile {
  id?: string;
  fileName: string;
  cid: string;
  fileSizeInBytes: number;
  mimeType?: string;
  createdAt?: number;
  lastUpdate?: number;
  publicKey?: string;
  encryption?: boolean;
}

export interface LighthouseDiagnosticStep {
  id: string;
  title: string;
  status: "success" | "warning" | "error";
  durationMs: number;
  details: string;
  data?: any;
}

export interface LighthouseDiagnosticReport {
  success: boolean;
  overallStatus: "healthy" | "degraded" | "error";
  totalDurationMs: number;
  timestamp: string;
  apiKeyMasked: string;
  keySource: string;
  steps: LighthouseDiagnosticStep[];
  storageMetrics: {
    dataUsed: number;
    dataLimit: number;
    totalFiles: number;
    canaryCid: string | null;
  };
}

const STORAGE_KEY_CUSTOM_LIGHTHOUSE = "blockndrive_lighthouse_api_key";

/**
 * Retrieve user's saved custom Lighthouse API key
 */
export function getStoredLighthouseApiKey(): string | null {
  if (typeof window === "undefined") return null;
  const key = localStorage.getItem(STORAGE_KEY_CUSTOM_LIGHTHOUSE);
  return key && key.trim() ? key.trim() : null;
}

/**
 * Save or clear user's custom Lighthouse API key
 */
export function setStoredLighthouseApiKey(key: string | null): void {
  if (typeof window === "undefined") return;
  if (!key || !key.trim()) {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_LIGHTHOUSE);
  } else {
    localStorage.setItem(STORAGE_KEY_CUSTOM_LIGHTHOUSE, key.trim());
  }
}

/**
 * Helper to get default headers with optional custom Lighthouse API Key
 */
function getLighthouseRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const customKey = getStoredLighthouseApiKey();
  if (customKey) {
    headers["x-lighthouse-key"] = customKey;
  }
  return headers;
}

/**
 * Fetch Lighthouse account status, data usage, and network connectivity
 */
export async function getLighthouseStatus(customKey?: string): Promise<LighthouseStatusResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const activeKey = customKey?.trim() || getStoredLighthouseApiKey();
  if (activeKey) {
    headers["x-lighthouse-key"] = activeKey;
  }

  const response = await fetch("/api/lighthouse/status", {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to query Lighthouse account status");
  }

  return response.json();
}

/**
 * Fetch list of uploaded files on Lighthouse network
 */
export async function getLighthouseUploads(customKey?: string): Promise<{
  success: boolean;
  fileList: LighthouseUploadedFile[];
  totalFiles: number;
}> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const activeKey = customKey?.trim() || getStoredLighthouseApiKey();
  if (activeKey) {
    headers["x-lighthouse-key"] = activeKey;
  }

  const response = await fetch("/api/lighthouse/uploads", {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch uploads from Lighthouse");
  }

  return response.json();
}

/**
 * Verify a Lighthouse API Key against the Lighthouse network
 */
export async function verifyLighthouseApiKey(apiKey: string): Promise<{
  valid: boolean;
  dataLimit: number;
  dataUsed: number;
  totalFiles: number;
}> {
  const response = await fetch("/api/lighthouse/verify-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });

  const data = await response.json();
  if (!response.ok || !data.valid) {
    throw new Error(data.error || "Invalid Lighthouse API Key");
  }

  return data;
}

/**
 * Run comprehensive diagnostic tests against Lighthouse storage node
 */
export async function runLighthouseDiagnostics(customKey?: string): Promise<LighthouseDiagnosticReport> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const activeKey = customKey?.trim() || getStoredLighthouseApiKey();
  if (activeKey) {
    headers["x-lighthouse-key"] = activeKey;
  }

  const response = await fetch("/api/lighthouse/diagnostics", {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to complete Lighthouse diagnostics");
  }

  return data;
}

/**
 * Upload encrypted file blob to Lighthouse IPFS
 */
export async function uploadEncryptedFileToLighthouse(
  fileName: string,
  encryptedBlob: Blob
): Promise<LighthouseUploadResponse> {
  const arrayBuffer = await encryptedBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Convert to Base64 in chunks to handle larger files without maximum call stack size exceeded
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as any);
  }
  const fileContentBase64 = window.btoa(binary);

  const response = await fetch("/api/lighthouse/upload", {
    method: "POST",
    headers: getLighthouseRequestHeaders(),
    body: JSON.stringify({
      fileName: `${fileName}.enc`,
      fileContentBase64,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to upload encrypted file to Lighthouse");
  }

  return response.json();
}

/**
 * Upload manifest JSON to Lighthouse IPFS
 */
export async function uploadManifestToLighthouse(
  manifest: ManifestData
): Promise<LighthouseUploadResponse> {
  const response = await fetch("/api/lighthouse/upload", {
    method: "POST",
    headers: getLighthouseRequestHeaders(),
    body: JSON.stringify({
      fileName: `manifest_${Date.now()}.json`,
      isJson: true,
      jsonData: manifest,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to upload manifest to Lighthouse");
  }

  return response.json();
}

/**
 * Fetch raw encrypted file content from IPFS or gateway
 */
export async function fetchEncryptedFileFromIPFS(
  fileCID: string,
  localCachedBuffer?: ArrayBuffer
): Promise<ArrayBuffer> {
  if (localCachedBuffer) {
    return localCachedBuffer;
  }

  const gateways = [
    `/api/ipfs/${fileCID}`,
    `https://gateway.lighthouse.storage/ipfs/${fileCID}`,
    `https://ipfs.io/ipfs/${fileCID}`,
    `https://cloudflare-ipfs.com/ipfs/${fileCID}`,
    `https://dweb.link/ipfs/${fileCID}`,
  ];

  for (const url of gateways) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        return await res.arrayBuffer();
      }
    } catch {
      // Continue to next gateway
    }
  }

  // Check in local persistence storage
  const stored = localStorage.getItem(`blockndrive_file_${fileCID}`);
  if (stored) {
    const binary = window.atob(stored);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  throw new Error(`Unable to fetch encrypted file from IPFS CID: ${fileCID}`);
}

/**
 * Fetch manifest JSON from IPFS
 */
export async function fetchManifestFromIPFS(
  manifestCID: string,
  localCachedManifest?: ManifestData
): Promise<ManifestData> {
  if (localCachedManifest) {
    return localCachedManifest;
  }

  const stored = localStorage.getItem(`blockndrive_manifest_${manifestCID}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  const gateways = [
    `/api/ipfs/${manifestCID}`,
    `https://gateway.lighthouse.storage/ipfs/${manifestCID}`,
    `https://ipfs.io/ipfs/${manifestCID}`,
    `https://cloudflare-ipfs.com/ipfs/${manifestCID}`,
  ];

  for (const url of gateways) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // try next
    }
  }

  throw new Error(`Unable to load manifest for CID: ${manifestCID}`);
}
