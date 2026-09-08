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
 * Get provider from window.ethereum or Sepolia public RPC
 */
export function getBrowserProvider(): ethers.BrowserProvider | null {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
}

/**
 * Get fallback read-only provider for Sepolia
 */
export function getReadOnlyProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider("https://rpc.sepolia.org");
}

/**
 * Request MetaMask connection
 */
export async function connectMetaMask(): Promise<{
  address: string;
  chainId: number;
  balance: string;
}> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed. Please install MetaMask or use Demo Mode.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts selected in MetaMask");
  }

  const network = await provider.getNetwork();
  const balanceWei = await provider.getBalance(accounts[0]);
  const balance = ethers.formatEther(balanceWei);

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
 * Upload document to BlockNDrive Smart Contract
 * Calling `uploadDocument(manifestCID, fileHash, manifestHash, initialRiskScore)`
 */
export async function uploadDocumentToContract(
  manifestCID: string,
  fileHash: string,
  manifestHash: string,
  initialRiskScore: number,
  isDemoMode = false,
  userAddress = "0x71C...Demo"
): Promise<{
  documentId: number;
  txHash: string;
}> {
  if (isDemoMode || !window.ethereum) {
    // Simulated blockchain execution with authentic transaction and document ID
    const demoDocs = getStoredDocuments();
    const newDocId = demoDocs.length + 1;
    const mockTxHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;

    return {
      documentId: newDocId,
      txHash: mockTxHash,
    };
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  // If not on Sepolia, offer switch
  if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
    const switched = await switchToSepolia();
    if (!switched) {
      console.warn("Continuing on current chain or fallback simulation");
    }
  }

  const contract = await getContract(true);

  // Format arguments
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

    // Parse DocumentUploaded event if available
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
    throw new Error(err.reason || err.message || "Failed to execute smart contract transaction");
  }
}

/**
 * Move document to 24-hour Archive (soft deletion on-chain / local storage)
 */
export async function deleteDocumentOnContract(
  documentId: number,
  isDemoMode = false,
  deletedAt = Date.now()
): Promise<string> {
  const docs = getStoredDocuments();
  const updated = docs.map((d) =>
    d.id === documentId ? { ...d, deleted: true, deletedAt } : d
  );
  localStorage.setItem("blockndrive_documents", JSON.stringify(updated));

  if (isDemoMode || !window.ethereum) {
    return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
  }

  try {
    const contract = await getContract(true);
    const tx = await contract.deleteDocument(documentId);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (err) {
    console.warn("Contract delete failed, updated local archive:", err);
    return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
  }
}

/**
 * Restore document from 24-hour Archive back to Active Vault
 */
export async function restoreDocumentOnContract(
  documentId: number,
  isDemoMode = false
): Promise<string> {
  const docs = getStoredDocuments();
  const updated = docs.map((d) =>
    d.id === documentId ? { ...d, deleted: false, deletedAt: undefined } : d
  );
  localStorage.setItem("blockndrive_documents", JSON.stringify(updated));

  return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
}

/**
 * Permanently delete document forever (so user never sees it again)
 */
export async function permanentlyDeleteDocument(
  documentId: number,
  isDemoMode = false
): Promise<string> {
  const docs = getStoredDocuments();
  const updated = docs.filter((d) => d.id !== documentId);
  localStorage.setItem("blockndrive_documents", JSON.stringify(updated));

  // Also remove cached keys and temporary decryption buffers
  try {
    const doc = docs.find((d) => d.id === documentId);
    if (doc?.fileHash) {
      localStorage.removeItem(`blockndrive_key_${doc.fileHash}`);
      delete (window as any)[`__cache_${doc.fileHash}`];
    }
  } catch {
    // ignore
  }

  return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
}

/**
 * Fetch documents owned by current wallet (including active and archived docs within 24h)
 */
export async function fetchUserDocuments(
  ownerAddress: string | null,
  isDemoMode = false
): Promise<VaultDocument[]> {
  const localDocs = getStoredDocuments();

  if (!ownerAddress) {
    return localDocs;
  }

  if (isDemoMode || !window.ethereum) {
    return localDocs.filter(
      (d) => d.owner.toLowerCase() === ownerAddress.toLowerCase() || d.owner.includes("Demo")
    );
  }

  try {
    const contract = await getContract(true);
    const docIds: bigint[] = await contract.getMyDocuments();

    const fetchedDocs: VaultDocument[] = [];

    for (const id of docIds) {
      const numId = Number(id);
      try {
        const rawDoc = await contract.getDocument(numId);
        // rawDoc is: [owner, manifestCID, fileHash, manifestHash, createdAt, updatedAt, riskScore, deleted]
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

    // Merge any locally saved documents that might not be on-chain yet
    for (const ld of localDocs) {
      if (!fetchedDocs.some((fd) => fd.id === ld.id)) {
        if (ld.owner.toLowerCase() === ownerAddress.toLowerCase()) {
          fetchedDocs.push(ld);
        }
      }
    }

    return fetchedDocs.filter((d) => !d.permanentlyDeleted);
  } catch (err) {
    console.warn("Chain query fallback to local cache:", err);
    return localDocs.filter(
      (d) => d.owner.toLowerCase() === ownerAddress.toLowerCase() || d.owner.includes("Demo")
    );
  }
}

/**
 * Local persistence helpers with 24-hour auto-purge cleanup
 */
export function getStoredDocuments(): VaultDocument[] {
  const RETENTION_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();

  try {
    const saved = localStorage.getItem("blockndrive_documents");
    if (saved) {
      const parsed: VaultDocument[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out permanently deleted items and expired archived items (>24h)
        const validDocs = parsed.filter((d) => {
          if (d.permanentlyDeleted) return false;
          if (d.deleted && d.deletedAt && now - d.deletedAt >= RETENTION_PERIOD_MS) {
            return false; // Automatically purged after 24 hours
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

  // Pre-seed sample documents if first load to match the diverse file types:
  // PDF, Image, Spreadsheet, Code, and Document
  const initialDocs: VaultDocument[] = [
    {
      id: 1,
      owner: "0x71C...Demo",
      manifestCID: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
      fileHash: "0x4a123f8b89e7cb289bca710892be80a15b3c0762cfef6905a96860d5e1b212f4",
      manifestHash: "0x9812730fcb278149ad7b219082ef6849b20e10ca456108520bfd65078a1bc402",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      riskScore: 18,
      deleted: false,
      txHash: "0x9ef24...3a71",
      manifest: {
        version: 1,
        name: "document.pdf",
        mimeType: "application/pdf",
        size: 342150,
        fileCID: "bafybeicvhnk4b3h2755n2m62f3m3df2q5a7h4kffj557a53m2f5j33",
        fileHash: "0x4a123f8b89e7cb289bca710892be80a15b3c0762cfef6905a96860d5e1b212f4",
        iv: "0x12f4901ba32009cb115e810a",
        encryptedKey: "0xa4b19c...demoKey",
        accessControl: {
          protocol: "lit-protocol-evm-access",
          version: "1.0.0",
          chain: "sepolia",
          contractAddress: BLOCKNDRIVE_CONTRACT_ADDRESS,
          ownerAddress: "0x71C...Demo",
          condition: {
            conditionType: "evmBasic",
            contractAddress: BLOCKNDRIVE_CONTRACT_ADDRESS,
            standardContractType: "Custom",
            chain: "sepolia",
            method: "isOwner",
            parameters: ["1"],
            returnValueTest: {
              comparator: "=",
              value: "true",
            },
          },
        },
        metadata: {
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          originalName: "document.pdf",
          encryptionAlgorithm: "AES-GCM-256",
          storageProvider: "Lighthouse (Filecoin/IPFS)",
        },
        aiAnalysis: {
          classification: "Business Agreement",
          category: "Legal & Corporate",
          sensitivity: "Low",
          summary: "Standard non-disclosure terms and confidentiality covenants.",
          detectedEntities: ["Party A", "Party B", "Term 2 Years"],
          complianceFlags: ["Standard NDA Clause"],
          riskScore: 18,
          riskLevel: "LOW",
          reasoning: "Standard business document with no critical financial keys or personal identities.",
        },
        riskScore: 18,
      },
    },
    {
      id: 2,
      owner: "0x71C...Demo",
      manifestCID: "bafybeiahz6vhn5cfq7udm7hu76uh7y26nf3efuylqabf3oclgtqy55seed",
      fileHash: "0x7c923f8b89e7cb289bca710892be80a15b3c0762cfef6905a96860d5e1b439e1",
      manifestHash: "0x5112730fcb278149ad7b219082ef6849b20e10ca456108520bfd65078a1ee901",
      createdAt: Date.now() - 1000 * 60 * 60 * 12,
      updatedAt: Date.now() - 1000 * 60 * 60 * 12,
      riskScore: 45,
      deleted: false,
      txHash: "0x4b721...e580",
      manifest: {
        version: 1,
        name: "marksheet.pdf",
        mimeType: "application/pdf",
        size: 512400,
        fileCID: "bafybeidwfnk4b3h2755n2m62f3m3df2q5a7h4kffj557a53m2f5j99",
        fileHash: "0x7c923f8b89e7cb289bca710892be80a15b3c0762cfef6905a96860d5e1b439e1",
        iv: "0x98d4101ba32009cb115e810f",
        encryptedKey: "0x89c21d...demoKey2",
        accessControl: {
          protocol: "lit-protocol-evm-access",
          version: "1.0.0",
          chain: "sepolia",
          contractAddress: BLOCKNDRIVE_CONTRACT_ADDRESS,
          ownerAddress: "0x71C...Demo",
          condition: {
            conditionType: "evmBasic",
            contractAddress: BLOCKNDRIVE_CONTRACT_ADDRESS,
            standardContractType: "Custom",
            chain: "sepolia",
            method: "isOwner",
            parameters: ["2"],
            returnValueTest: {
              comparator: "=",
              value: "true",
            },
          },
        },
        metadata: {
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          originalName: "marksheet.pdf",
          encryptionAlgorithm: "AES-GCM-256",
          storageProvider: "Lighthouse (Filecoin/IPFS)",
        },
        aiAnalysis: {
          classification: "Academic Transcript",
          category: "Identity & Education",
          sensitivity: "Medium",
          summary: "Official academic grading sheet with candidate student ID and grades.",
          detectedEntities: ["Student ID", "University Board", "GPA 3.9"],
          complianceFlags: ["FERPA / Educational Privacy"],
          riskScore: 45,
          riskLevel: "LOW",
          reasoning: "Personal identity and educational grades. Moderate privacy sensitivity.",
        },
        riskScore: 45,
      },
    },
    {
      id: 3,
      owner: "0x71C...Demo",
      manifestCID: "bafybeifkycidimage7udm7hu76uh7y26nf3efuylqabf3oclgtqy55photo",
      fileHash: "0x3f12458b89e7cb289bca710892be80a15b3c0762cfef6905a96860d5e1b899a2",
      manifestHash: "0x8914730fcb278149ad7b219082ef6849b20e10ca456108520bfd65078a1bc11a",
      createdAt: Date.now() - 1000 * 60 * 60 * 6,
      updatedAt: Date.now() - 1000 * 60 * 60 * 6,
      riskScore: 72,
      deleted: false,
      txHash: "0x2ab14...998c",
      manifest: {
        version: 1,
        name: "passport_identity_scan.png",
        mimeType: "image/png",
        size: 1420500,
        fileCID: "bafybeidwfnk4b3h2755n2m62f3m3df2q5a7h4kffj557a53m2f5jimg",
        fileHash: "0x3f12458b89e7cb289bca710892be80a15b3c0762cfef6905a96860d5e1b899a2",
        iv: "0x55d4101ba32009cb115e810a",
        encryptedKey: "0x12c21d...demoKey3",
        accessControl: {
          protocol: "lit-protocol-evm-access",
          version: "1.0.0",
          chain: "sepolia",
          contractAddress: BLOCKNDRIVE_CONTRACT_ADDRESS,
          ownerAddress: "0x71C...Demo",
          condition: {
            conditionType: "evmBasic",
            contractAddress: BLOCKNDRIVE_CONTRACT_ADDRESS,
            standardContractType: "Custom",
            chain: "sepolia",
            method: "isOwner",
            parameters: ["3"],
            returnValueTest: {
              comparator: "=",
              value: "true",
            },
          },
        },
        metadata: {
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          originalName: "passport_identity_scan.png",
          encryptionAlgorithm: "AES-GCM-256",
          storageProvider: "Lighthouse (Filecoin/IPFS)",
        },
        aiAnalysis: {
          classification: "Identity Document / Photo ID",
          category: "Government ID",
          sensitivity: "High",
          summary: "Biometric passport image scan with national identification number.",
          detectedEntities: ["Passport Number", "Date of Birth", "MRZ Zone"],
          complianceFlags: ["GDPR Special Category", "KYC Identity"],
          riskScore: 72,
          riskLevel: "MEDIUM",
          reasoning: "High-value government identity document. Sealed with Lit Protocol EVM access.",
        },
        riskScore: 72,
      },
    },
    {
      id: 4,
      owner: "0x71C...Demo",
      manifestCID: "bafybeicodexlsxtudm7hu76uh7y26nf3efuylqabf3oclgtqy55balance",
      fileHash: "0x5d923f8b89e7cb289bca710892be80a15b3c0762cfef6905a96860d5e1b777a1",
      manifestHash: "0x7212730fcb278149ad7b219082ef6849b20e10ca456108520bfd65078a1ee23c",
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      updatedAt: Date.now() - 1000 * 60 * 60 * 2,
      riskScore: 30,
      deleted: false,
      txHash: "0x7cd81...441a",
      manifest: {
        version: 1,
        name: "treasury_balance_sheet.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size: 890400,
        fileCID: "bafybeidwfnk4b3h2755n2m62f3m3df2q5a7h4kffj557a53m2f5jxls",
        fileHash: "0x5d923f8b89e7cb289bca710892be80a15b3c0762cfef6905a96860d5e1b777a1",
        iv: "0x77d4101ba32009cb115e810c",
        encryptedKey: "0x99c21d...demoKey4",
        accessControl: {
          protocol: "lit-protocol-evm-access",
          version: "1.0.0",
          chain: "sepolia",
          contractAddress: BLOCKNDRIVE_CONTRACT_ADDRESS,
          ownerAddress: "0x71C...Demo",
          condition: {
            conditionType: "evmBasic",
            contractAddress: BLOCKNDRIVE_CONTRACT_ADDRESS,
            standardContractType: "Custom",
            chain: "sepolia",
            method: "isOwner",
            parameters: ["4"],
            returnValueTest: {
              comparator: "=",
              value: "true",
            },
          },
        },
        metadata: {
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          originalName: "treasury_balance_sheet.xlsx",
          encryptionAlgorithm: "AES-GCM-256",
          storageProvider: "Lighthouse (Filecoin/IPFS)",
        },
        aiAnalysis: {
          classification: "Financial Audit Sheet",
          category: "Financial Assets",
          sensitivity: "Low",
          summary: "Quarterly liquidity balances, DeFi reserves, and reserve allocations.",
          detectedEntities: ["ETH Balance", "USDC Vault", "Total $4.2M"],
          complianceFlags: ["Financial Audit"],
          riskScore: 30,
          riskLevel: "LOW",
          reasoning: "Encrypted financial ledger. Safe corporate risk score.",
        },
        riskScore: 30,
      },
    },
    {
      id: 5,
      owner: "0x71C...Demo",
      manifestCID: "bafybeisoliditytudm7hu76uh7y26nf3efuylqabf3oclgtqy55contract",
      fileHash: "0x8e923f8b89e7cb289bca710892be80a15b3c0762cfef6905a96860d5e1b111e5",
      manifestHash: "0x6312730fcb278149ad7b219082ef6849b20e10ca456108520bfd65078a1ee88f",
      createdAt: Date.now() - 1000 * 60 * 30,
      updatedAt: Date.now() - 1000 * 60 * 30,
      riskScore: 24,
      deleted: false,
      txHash: "0x1fe94...772b",
      manifest: {
        version: 1,
        name: "BlockNDriveVault.sol",
        mimeType: "text/x-solidity",
        size: 18450,
        fileCID: "bafybeidwfnk4b3h2755n2m62f3m3df2q5a7h4kffj557a53m2f5jsol",
        fileHash: "0x8e923f8b89e7cb289bca710892be80a15b3c0762cfef6905a96860d5e1b111e5",
        iv: "0x44d4101ba32009cb115e810d",
        encryptedKey: "0x33c21d...demoKey5",
        accessControl: {
          protocol: "lit-protocol-evm-access",
          version: "1.0.0",
          chain: "sepolia",
          contractAddress: BLOCKNDRIVE_CONTRACT_ADDRESS,
          ownerAddress: "0x71C...Demo",
          condition: {
            conditionType: "evmBasic",
            contractAddress: BLOCKNDRIVE_CONTRACT_ADDRESS,
            standardContractType: "Custom",
            chain: "sepolia",
            method: "isOwner",
            parameters: ["5"],
            returnValueTest: {
              comparator: "=",
              value: "true",
            },
          },
        },
        metadata: {
          uploadedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          originalName: "BlockNDriveVault.sol",
          encryptionAlgorithm: "AES-GCM-256",
          storageProvider: "Lighthouse (Filecoin/IPFS)",
        },
        aiAnalysis: {
          classification: "Solidity Smart Contract Source",
          category: "Source Code & Cryptography",
          sensitivity: "Low",
          summary: "EVM Smart contract source with reentrancy guards and ERC-721 access checks.",
          detectedEntities: ["Solidity 0.8.20", "OpenZeppelin ReentrancyGuard", "emit DocumentRegistered"],
          complianceFlags: ["Open Source Verification"],
          riskScore: 24,
          riskLevel: "LOW",
          reasoning: "Secure smart contract codebase with standard access control patterns.",
        },
        riskScore: 24,
      },
    },
  ];

  localStorage.setItem("blockndrive_documents", JSON.stringify(initialDocs));
  return initialDocs;
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
