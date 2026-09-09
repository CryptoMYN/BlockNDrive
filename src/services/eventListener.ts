import { ethers } from "ethers";
import {
  BLOCKNDRIVE_CONTRACT_ADDRESS,
  BLOCKNDRIVE_ABI,
  SEPOLIA_CONFIG,
} from "../constants/contract";
import type { VaultDocument, ManifestData } from "../types";
import { getBrowserProvider, getReadOnlyProvider } from "./blockchain";

export interface DocumentRegisteredEventData {
  documentId: number;
  owner: string;
  manifestCID: string;
  fileHash: string;
  manifestHash: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  document?: VaultDocument;
}

export type DocumentRegisteredCallback = (
  eventData: DocumentRegisteredEventData
) => void | Promise<void>;

export type DocumentDeletedCallback = (
  documentId: number,
  owner: string,
  txHash: string
) => void | Promise<void>;

export interface EventListenerOptions {
  ownerAddress?: string | null;
  onDocumentRegistered?: DocumentRegisteredCallback;
  onDocumentUploaded?: DocumentRegisteredCallback;
  onDocumentDeleted?: DocumentDeletedCallback;
  onError?: (error: Error) => void;
  enablePollingFallback?: boolean;
  pollingIntervalMs?: number;
}

export interface EventSubscription {
  unsubscribe: () => void;
  isListening: () => boolean;
}

/**
 * Fetch manifest content from IPFS/Gateway or local cache to construct full VaultDocument
 */
async function resolveManifest(
  manifestCID: string,
  fileHash: string
): Promise<ManifestData | undefined> {
  // Check local storage / session cache first
  try {
    const cachedKey = localStorage.getItem(`blockndrive_key_${fileHash}`);
    const localDocs = JSON.parse(
      localStorage.getItem("blockndrive_documents") || "[]"
    );
    const existing = localDocs.find(
      (d: VaultDocument) =>
        d.manifestCID === manifestCID || d.fileHash === fileHash
    );
    if (existing?.manifest) {
      return existing.manifest;
    }
  } catch {
    // ignore
  }

  // Attempt to fetch from local server IPFS gateway proxy
  try {
    const res = await fetch(`/api/ipfs/${manifestCID}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // ignore
  }

  // Attempt public Lighthouse gateway
  try {
    const res = await fetch(
      `https://gateway.lighthouse.storage/ipfs/${manifestCID}`,
      {
        signal: AbortSignal.timeout(3500),
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // fallback default structure
  }

  return undefined;
}

/**
 * Start listening for 'DocumentRegistered' (and 'DocumentUploaded') events on the Sepolia blockchain.
 * Returns an unsubscribe function to cleanly detach listeners when unmounting.
 */
export function listenToDocumentRegistered(
  options: EventListenerOptions
): EventSubscription {
  const {
    ownerAddress,
    onDocumentRegistered,
    onDocumentUploaded,
    onDocumentDeleted,
    onError,
    enablePollingFallback = true,
    pollingIntervalMs = 8000,
  } = options;

  let isSubscribed = true;
  let activeContract: ethers.Contract | null = null;
  let pollingTimer: any = null;
  let lastCheckedBlock = 0;

  const targetOwnerLower = ownerAddress ? ownerAddress.toLowerCase() : null;

  // Process and dispatch a DocumentRegistered / DocumentUploaded event
  const handleRegisteredEvent = async (
    docIdRaw: any,
    ownerRaw: any,
    manifestCIDRaw: any,
    fileHashRaw: any,
    manifestHashRaw: any,
    eventPayload: any
  ) => {
    try {
      const docId = Number(docIdRaw);
      const owner = String(ownerRaw);
      const manifestCID = String(manifestCIDRaw || "");
      const fileHash = String(fileHashRaw || "");
      const manifestHash = String(manifestHashRaw || "");

      // If filtering by owner, ignore events from other wallets
      if (targetOwnerLower && owner.toLowerCase() !== targetOwnerLower) {
        return;
      }

      const txHash =
        eventPayload?.log?.transactionHash ||
        eventPayload?.transactionHash ||
        "0x";
      const blockNumber =
        Number(eventPayload?.log?.blockNumber || eventPayload?.blockNumber) || 0;
      const now = Date.now();

      // Resolve manifest details asynchronously
      const manifest = await resolveManifest(manifestCID, fileHash);

      const document: VaultDocument = {
        id: docId,
        owner,
        manifestCID,
        fileHash,
        manifestHash,
        createdAt: now,
        updatedAt: now,
        riskScore: manifest?.aiAnalysis?.riskScore ?? 15,
        deleted: false,
        txHash,
        manifest,
      };

      const eventData: DocumentRegisteredEventData = {
        documentId: docId,
        owner,
        manifestCID,
        fileHash,
        manifestHash,
        transactionHash: txHash,
        blockNumber,
        timestamp: now,
        document,
      };

      if (onDocumentRegistered) {
        onDocumentRegistered(eventData);
      }
      if (onDocumentUploaded) {
        onDocumentUploaded(eventData);
      }
    } catch (err: any) {
      console.warn("[EventListener] Error processing registered event:", err);
      if (onError) onError(err);
    }
  };

  const handleDeletedEvent = async (
    docIdRaw: any,
    ownerRaw: any,
    eventPayload: any
  ) => {
    try {
      const docId = Number(docIdRaw);
      const owner = String(ownerRaw);
      if (targetOwnerLower && owner.toLowerCase() !== targetOwnerLower) {
        return;
      }
      const txHash =
        eventPayload?.log?.transactionHash ||
        eventPayload?.transactionHash ||
        "0x";
      if (onDocumentDeleted) {
        onDocumentDeleted(docId, owner, txHash);
      }
    } catch (err: any) {
      console.warn("[EventListener] Error processing deleted event:", err);
    }
  };

  // Initialize event listener via provider
  const initListener = async () => {
    try {
      // Prefer browser MetaMask provider if connected, otherwise read-only RPC
      const browserProvider = getBrowserProvider();
      const provider = browserProvider || getReadOnlyProvider();

      const contract = new ethers.Contract(
        BLOCKNDRIVE_CONTRACT_ADDRESS,
        BLOCKNDRIVE_ABI,
        provider
      );
      activeContract = contract;

      // 1. Attach native ethers contract event listeners
      try {
        contract.on("DocumentRegistered", handleRegisteredEvent);
      } catch (err) {
        console.debug("DocumentRegistered listener fallback:", err);
      }

      try {
        contract.on("DocumentUploaded", handleRegisteredEvent);
      } catch (err) {
        console.debug("DocumentUploaded listener fallback:", err);
      }

      try {
        if (onDocumentDeleted) {
          contract.on("DocumentDeleted", handleDeletedEvent);
        }
      } catch (err) {
        console.debug("DocumentDeleted listener fallback:", err);
      }

      // Record current block number for delta polling fallback
      try {
        lastCheckedBlock = await provider.getBlockNumber();
      } catch {
        lastCheckedBlock = 0;
      }

      // 2. Setup periodic log query as fallback against unstable public RPC websocket connections
      if (enablePollingFallback) {
        pollingTimer = setInterval(async () => {
          if (!isSubscribed) return;
          try {
            const currentBlock = await provider.getBlockNumber();
            if (lastCheckedBlock > 0 && currentBlock > lastCheckedBlock) {
              const fromBlock = lastCheckedBlock + 1;
              const toBlock = currentBlock;

              // Query DocumentRegistered & DocumentUploaded event logs
              const registeredFilter = contract.filters.DocumentRegistered?.();
              const uploadedFilter = contract.filters.DocumentUploaded?.();

              if (registeredFilter) {
                const logs = await contract.queryFilter(
                  registeredFilter,
                  fromBlock,
                  toBlock
                );
                for (const log of logs) {
                  const parsed = contract.interface.parseLog(log);
                  if (parsed && parsed.name === "DocumentRegistered") {
                    await handleRegisteredEvent(
                      parsed.args.documentId,
                      parsed.args.owner,
                      parsed.args.manifestCID,
                      parsed.args.fileHash,
                      parsed.args.manifestHash,
                      log
                    );
                  }
                }
              }

              if (uploadedFilter) {
                const logs = await contract.queryFilter(
                  uploadedFilter,
                  fromBlock,
                  toBlock
                );
                for (const log of logs) {
                  const parsed = contract.interface.parseLog(log);
                  if (parsed && parsed.name === "DocumentUploaded") {
                    await handleRegisteredEvent(
                      parsed.args.documentId,
                      parsed.args.owner,
                      parsed.args.manifestCID,
                      parsed.args.fileHash,
                      parsed.args.manifestHash,
                      log
                    );
                  }
                }
              }

              lastCheckedBlock = currentBlock;
            }
          } catch (pollErr) {
            // Ignore temporary RPC rate limit warnings in polling
          }
        }, pollingIntervalMs);
      }
    } catch (err: any) {
      console.warn("[EventListener] Failed to initialize contract events:", err);
      if (onError) onError(err);
    }
  };

  initListener();

  return {
    unsubscribe: () => {
      isSubscribed = false;
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
      if (activeContract) {
        try {
          activeContract.removeAllListeners("DocumentRegistered");
          activeContract.removeAllListeners("DocumentUploaded");
          activeContract.removeAllListeners("DocumentDeleted");
        } catch {
          // ignore
        }
        activeContract = null;
      }
    },
    isListening: () => isSubscribed,
  };
}

export default listenToDocumentRegistered;
