import type { ManifestData } from "../types";

export interface LighthouseUploadResponse {
  success: boolean;
  cid: string;
  name: string;
  size: number;
  storageProvider: string;
  gatewayUrl: string;
  warning?: string;
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
    headers: {
      "Content-Type": "application/json",
    },
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
    headers: {
      "Content-Type": "application/json",
    },
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
