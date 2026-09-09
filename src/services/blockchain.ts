import { ethers } from "ethers";
import {
  BLOCKNDRIVE_CONTRACT_ADDRESS,
  BLOCKNDRIVE_ABI,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_CONFIG,
} from "../constants/contract";
import type { VaultDocument, ManifestData } from "../types";

declare global {
  interface Window {
    ethereum?: any;
  }
}

/**
 * Detect if application is currently embedded in an iframe (e.g. AI Studio preview)
 */
export function isRunningInIframe(): boolean {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Get active MetaMask or EIP-1193 Ethereum provider
 */
export function getMetaMaskProvider(): any {
  if (typeof window === "undefined" || !window.ethereum) return null;
  if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
    const mm = window.ethereum.providers.find((p: any) => p.isMetaMask);
    if (mm) return mm;
  }
  return window.ethereum;
}

/**
 * Check whether MetaMask or compatible Web3 provider is detected
 */
export function isMetaMaskDetected(): boolean {
  return !!getMetaMaskProvider();
}

/**
 * Get browser provider from window.ethereum
 */
export function getBrowserProvider(): ethers.BrowserProvider | null {
  const eth = getMetaMaskProvider();
  if (eth) {
    return new ethers.BrowserProvider(eth);
  }
  return null;
}

/**
 * Get read-only provider for Sepolia
 */
export function getReadOnlyProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider("https://rpc.sepolia.org");
}

/**
 * Request MetaMask connection on On-Chain Gas Tier
 */
export async function connectMetaMask(): Promise<{
  address: string;
  chainId: number;
  balance: string;
}> {
  const ethProvider = getMetaMaskProvider();
  if (!ethProvider) {
    if (isRunningInIframe()) {
      throw new Error(
        "MetaMask extension was not detected inside this preview iframe. Browser extensions cannot inject into iframes. Please open the app in a new tab to connect MetaMask."
      );
    }
    throw new Error("MetaMask is not installed. Please install the MetaMask browser extension for On-Chain Gas Tier access.");
  }

  const provider = new ethers.BrowserProvider(ethProvider);
  const accounts = await provider.send("eth_requestAccounts", []);
  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts selected in MetaMask. Please approve the connection request in MetaMask.");
  }

  const network = await provider.getNetwork();
  let balance = "0.0000";
  try {
    const balanceWei = await provider.getBalance(accounts[0]);
    balance = ethers.formatEther(balanceWei);
  } catch (balErr) {
    console.warn("Could not fetch balance:", balErr);
  }

  // Switch to Sepolia if on another network
  if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
    try {
      await switchToSepolia();
    } catch {
      // ignore
    }
  }

  return {
    address: accounts[0],
    chainId: Number(network.chainId),
    balance: Number(balance).toFixed(4),
  };
}

/**
 * Switch or add Sepolia network in MetaMask
 */
export async function switchToSepolia(): Promise<boolean> {
  if (!window.ethereum) return false;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CONFIG.chainId }],
    });
    return true;
  } catch (switchError: any) {
    // 4902 means the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [SEPOLIA_CONFIG],
        });
        return true;
      } catch (addError) {
        console.error("Failed to add Sepolia network:", addError);
      }
    }
    console.error("Failed to switch to Sepolia:", switchError);
    return false;
  }
}

/**
 * Get contract instance with signer or read-only provider
 */
export async function getContract(
  withSigner = false
): Promise<ethers.Contract> {
  const browserProvider = getBrowserProvider();

  if (withSigner && browserProvider) {
    const signer = await browserProvider.getSigner();
    return new ethers.Contract(
      BLOCKNDRIVE_CONTRACT_ADDRESS,
      BLOCKNDRIVE_ABI,
      signer
    );
  }

  const provider = browserProvider || getReadOnlyProvider();
  return new ethers.Contract(
    BLOCKNDRIVE_CONTRACT_ADDRESS,
    BLOCKNDRIVE_ABI,
    provider
  );
}

/**
 * Estimate gas cost for document registration on Sepolia
 */
export async function estimateRegistrationGas(
  manifestCID: string,
  fileHash: string,
  manifestHash: string,
  initialRiskScore: number
): Promise<{ gasUnits: string; estimatedEth: string } | null> {
  try {
    if (!window.ethereum) return null;
    const contract = await getContract(true);
    const sanitizedFileHash = ethers.zeroPadValue(fileHash, 32);
    const sanitizedManifestHash = ethers.zeroPadValue(manifestHash, 32);
    const score = Math.min(100, Math.max(0, Math.round(initialRiskScore)));

    const estimated = await contract.uploadDocument.estimateGas(
      manifestCID,
      sanitizedFileHash,
      sanitizedManifestHash,
      score
    );

    const provider = getBrowserProvider();
    if (provider) {
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(2000000000); // 2 gwei fallback
      const totalCostWei = estimated * gasPrice;
      return {
        gasUnits: estimated.toString(),
        estimatedEth: ethers.formatEther(totalCostWei),
      };
    }
    return {
      gasUnits: estimated.toString(),
      estimatedEth: "~0.0003 ETH",
    };
  } catch (err) {
    console.warn("Could not estimate gas:", err);
    return null;
  }
}

/**
 * Upload document to BlockNDrive Smart Contract on Ethereum Sepolia (On-Chain Gas Tier)
 * Calls `contract.uploadDocument(manifestCID, fileHash, manifestHash, initialRiskScore)`
 */
export async function uploadDocumentToContract(
  manifestCID: string,
  fileHash: string,
  manifestHash: string,
  initialRiskScore: number
): Promise<{
  documentId: number;
  txHash: string;
}> {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask is required for On-Chain Gas Tier execution. Please connect your MetaMask wallet."
    );
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  // If not on Sepolia, enforce switch
  if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
    const switched = await switchToSepolia();
    if (!switched) {
      throw new Error(
        "Please switch your MetaMask network to Ethereum Sepolia Testnet to broadcast this on-chain transaction."
      );
    }
  }

  // Check wallet balance
  const signer = await provider.getSigner();
  const balanceWei = await provider.getBalance(signer.address);
  if (balanceWei === 0n) {
    throw new Error(
      `Your Sepolia wallet (${signer.address.slice(0, 6)}...${signer.address.slice(-4)}) has 0.0000 ETH. On-Chain Gas Tier requires a fraction of Sepolia testnet ETH for gas. Claim free testnet ETH from the Sepolia Faucet Hub.`
    );
  }

  const contract = await getContract(true);

  // Format arguments for EVM ABI
  const sanitizedFileHash = ethers.zeroPadValue(fileHash, 32);
  const sanitizedManifestHash = ethers.zeroPadValue(manifestHash, 32);
  const score = Math.min(100, Math.max(0, Math.round(initialRiskScore)));

  try {
    const tx = await contract.uploadDocument(
      manifestCID,
      sanitizedFileHash,
      sanitizedManifestHash,
      score
    );

    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error("Smart contract transaction reverted on Sepolia.");
    }

    // Parse DocumentUploaded event from logs
    let docId = 1;
    if (receipt.logs) {
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === "DocumentUploaded") {
            docId = Number(parsed.args.documentId);
            break;
          }
        } catch {
          // not this contract log
        }
      }
    }

    return {
      documentId: docId,
      txHash: receipt.hash,
    };
  } catch (err: any) {
    console.error("Smart contract upload failed:", err);
    if (err.code === "ACTION_REJECTED" || err.message?.includes("user rejected")) {
      throw new Error("Transaction rejected in MetaMask. The on-chain registration was cancelled.");
    }
    throw new Error(err.reason || err.message || "Failed to execute on-chain smart contract transaction.");
  }
}

/**
 * Move document to Archive on-chain (contract call with gas)
 */
export async function deleteDocumentOnContract(
  documentId: number,
  deletedAt = Date.now()
): Promise<string> {
  const docs = getStoredDocuments();
  const updated = docs.map((d) =>
    d.id === documentId ? { ...d, deleted: true, deletedAt } : d
  );
  localStorage.setItem("blockndrive_documents", JSON.stringify(updated));

  if (!window.ethereum) {
    throw new Error("MetaMask is required to sign on-chain document deletion.");
  }

  try {
    const contract = await getContract(true);
    const tx = await contract.deleteDocument(documentId);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (err: any) {
    console.error("Contract delete transaction failed:", err);
    throw new Error(err.reason || err.message || "Failed to execute on-chain delete transaction in MetaMask.");
  }
}

/**
 * Restore document from Archive back to Active Vault
 */
export async function restoreDocumentOnContract(
  documentId: number
): Promise<string> {
  const docs = getStoredDocuments();
  const updated = docs.map((d) =>
    d.id === documentId ? { ...d, deleted: false, deletedAt: undefined } : d
  );
  localStorage.setItem("blockndrive_documents", JSON.stringify(updated));

  return "0x-restored-locally";
}

/**
 * Permanently delete document forever
 */
export async function permanentlyDeleteDocument(
  documentId: number
): Promise<string> {
  const docs = getStoredDocuments();
  const updated = docs.filter((d) => d.id !== documentId);
  localStorage.setItem("blockndrive_documents", JSON.stringify(updated));

  try {
    const permDeletedRaw = localStorage.getItem("blockndrive_permanently_deleted_ids");
    const permDeletedIds: number[] = permDeletedRaw ? JSON.parse(permDeletedRaw) : [];
    if (!permDeletedIds.includes(documentId)) {
      permDeletedIds.push(documentId);
      localStorage.setItem("blockndrive_permanently_deleted_ids", JSON.stringify(permDeletedIds));
    }
  } catch {
    // ignore
  }

  try {
    const doc = docs.find((d) => d.id === documentId);
    if (doc?.fileHash) {
      localStorage.removeItem(`blockndrive_key_${doc.fileHash}`);
      delete (window as any)[`__cache_${doc.fileHash}`];
    }
  } catch {
    // ignore
  }

  return "0x-permanently-deleted";
}

/**
 * Fetch documents owned by current wallet from the Sepolia smart contract
 */
export async function fetchUserDocuments(
  ownerAddress: string | null
): Promise<VaultDocument[]> {
  const localDocs = getStoredDocuments();

  let permDeletedIds: number[] = [];
  try {
    const raw = localStorage.getItem("blockndrive_permanently_deleted_ids");
    if (raw) permDeletedIds = JSON.parse(raw);
  } catch {
    // ignore
  }

  if (!ownerAddress) {
    return [];
  }

  if (!window.ethereum) {
    return localDocs.filter(
      (d) => d.owner.toLowerCase() === ownerAddress.toLowerCase() && !permDeletedIds.includes(d.id)
    );
  }

  try {
    const contract = await getContract(true);
    const docIds: bigint[] = await contract.getMyDocuments();

    const fetchedDocs: VaultDocument[] = [];

    for (const id of docIds) {
      const numId = Number(id);
      if (permDeletedIds.includes(numId)) continue;

      try {
        const rawDoc = await contract.getDocument(numId);
        // rawDoc: [owner, manifestCID, fileHash, manifestHash, createdAt, updatedAt, riskScore, deleted]
        const localMatch = localDocs.find((d) => d.id === numId);

        fetchedDocs.push({
          id: numId,
          owner: rawDoc.owner,
          manifestCID: rawDoc.manifestCID,
          fileHash: rawDoc.fileHash,
          manifestHash: rawDoc.manifestHash,
          createdAt: Number(rawDoc.createdAt) * 1000,
          updatedAt: Number(rawDoc.updatedAt) * 1000,
          riskScore: Number(rawDoc.riskScore),
          deleted: rawDoc.deleted || Boolean(localMatch?.deleted),
          deletedAt: localMatch?.deletedAt,
          permanentlyDeleted: false,
          manifest: localMatch?.manifest,
          txHash: localMatch?.txHash,
        });
      } catch (docErr) {
        console.warn(`Failed to fetch doc ${numId} details from chain:`, docErr);
      }
    }

    // Merge any cached manifests
    for (const ld of localDocs) {
      if (!permDeletedIds.includes(ld.id) && !fetchedDocs.some((fd) => fd.id === ld.id)) {
        if (ld.owner.toLowerCase() === ownerAddress.toLowerCase()) {
          fetchedDocs.push(ld);
        }
      }
    }

    return fetchedDocs.filter((d) => !d.permanentlyDeleted && !permDeletedIds.includes(d.id));
  } catch (err) {
    console.warn("Chain query fallback to local cache:", err);
    return localDocs.filter(
      (d) => d.owner.toLowerCase() === ownerAddress.toLowerCase() && !permDeletedIds.includes(d.id)
    );
  }
}

/**
 * Local storage persistence helper
 */
export function getStoredDocuments(): VaultDocument[] {
  const RETENTION_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();

  let permDeletedIds: number[] = [];
  try {
    const raw = localStorage.getItem("blockndrive_permanently_deleted_ids");
    if (raw) permDeletedIds = JSON.parse(raw);
  } catch {
    // ignore
  }

  try {
    const saved = localStorage.getItem("blockndrive_documents");
    if (saved) {
      const parsed: VaultDocument[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validDocs = parsed.filter((d) => {
          if (permDeletedIds.includes(d.id)) return false;
          if (d.permanentlyDeleted) return false;
          if (d.deleted && d.deletedAt && now - d.deletedAt >= RETENTION_PERIOD_MS) {
            return false;
          }
          return true;
        });

        if (validDocs.length !== parsed.length) {
          localStorage.setItem("blockndrive_documents", JSON.stringify(validDocs));
        }

        return validDocs;
      }
    }
  } catch {
    // ignore
  }

  return [];
}

/**
 * Clear stored documents
 */
export function clearStoredDocuments(): void {
  localStorage.removeItem("blockndrive_documents");
}

export function saveDocumentToStorage(doc: VaultDocument): void {
  const current = getStoredDocuments();
  const index = current.findIndex((d) => d.id === doc.id);
  if (index >= 0) {
    current[index] = doc;
  } else {
    current.unshift(doc);
  }
  localStorage.setItem("blockndrive_documents", JSON.stringify(current));
}
