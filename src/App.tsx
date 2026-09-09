import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { UploadSection } from "./components/UploadSection";
import { DocumentList } from "./components/DocumentList";
import { DocumentDetailsModal } from "./components/DocumentDetailsModal";
import { ChainlinkCREModal } from "./components/ChainlinkCREModal";
import { StorageQuotaCard } from "./components/StorageQuotaCard";
import { ProjectOverviewModal } from "./components/ProjectOverviewModal";
import { WalletConnectModal } from "./components/WalletConnectModal";
import { ShareAppModal } from "./components/ShareAppModal";
import { FaucetGuideModal } from "./components/FaucetGuideModal";
import { DebugDiagnosticsModal } from "./components/DebugDiagnosticsModal";
import { PublicOnboardingHero } from "./components/PublicOnboardingHero";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { useTheme } from "./hooks/useTheme";
import { useBlockchainEventListener } from "./hooks/useBlockchainEventListener";
import type { VaultDocument, WalletState } from "./types";
import {
  connectMetaMask,
  fetchUserDocuments,
  getStoredDocuments,
  restoreDocumentOnContract,
  permanentlyDeleteDocument,
} from "./services/blockchain";
import {
  parseLitShareableLink,
  isLitPayloadExpired,
  formatLitTimeRemaining,
} from "./services/crypto";
import {
  saveDocumentToFirestore,
  getUserDocumentsFromFirestore,
  deleteDocumentInFirestore,
  restoreDocumentInFirestore,
  permanentlyDeleteDocumentInFirestore,
  logDocumentActivity,
} from "./lib/firebase";
import {
  BLOCKNDRIVE_CONTRACT_ADDRESS,
  CRE_FORWARDER_ADDRESS,
  SEPOLIA_CHAIN_ID,
} from "./constants/contract";
import {
  ShieldCheck,
  Cpu,
  Sparkles,
  CheckCircle2,
  Fuel,
} from "lucide-react";

export default function App() {
  const { isDark, toggleTheme } = useTheme();

  // Pure Web3 MetaMask Wallet state initialization
  const [wallet, setWallet] = useState<WalletState>(() => {
    const hasMetaMask = typeof window !== "undefined" && !!window.ethereum;
    return {
      isConnected: false,
      address: null,
      chainId: SEPOLIA_CHAIN_ID,
      networkName: "Sepolia",
      balance: null,
      isMetaMaskAvailable: hasMetaMask,
    };
  });

  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);
  const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);
  const [showCREModal, setShowCREModal] = useState<boolean>(false);
  const [showOverviewModal, setShowOverviewModal] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showFaucetModal, setShowFaucetModal] = useState<boolean>(false);
  const [showDebugModal, setShowDebugModal] = useState<boolean>(false);
  const [authNotification, setAuthNotification] = useState<string | null>(null);

  // Check if MetaMask is available on mount & auto-listen for account/network changes
  useEffect(() => {
    const hasMetaMask = typeof window !== "undefined" && !!window.ethereum;
    setWallet((prev) => ({ ...prev, isMetaMaskAvailable: hasMetaMask }));

    if (hasMetaMask && window.ethereum) {
      // Check if already authorized
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setWallet((prev) => ({
              ...prev,
              isConnected: true,
              address: accounts[0],
              networkName: "Sepolia Testnet",
            }));
            loadDocuments(accounts[0]);
          } else {
            loadDocuments(null);
          }
        })
        .catch(() => {
          loadDocuments(null);
        });

      window.ethereum.on?.("accountsChanged", (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          const newAddr = accounts[0];
          setWallet((prev) => ({
            ...prev,
            isConnected: true,
            address: newAddr,
            networkName: "Sepolia Testnet",
          }));
          setAuthNotification(`🦊 MetaMask Account Switched: ${newAddr.slice(0, 6)}...${newAddr.slice(-4)}`);
          setTimeout(() => setAuthNotification(null), 4000);
          loadDocuments(newAddr);
        } else {
          setWallet((prev) => ({
            ...prev,
            isConnected: false,
            address: null,
            balance: null,
          }));
          setDocuments([]);
        }
      });

      window.ethereum.on?.("chainChanged", () => {
        window.location.reload();
      });
    } else {
      loadDocuments(null);
    }
  }, []);

  // Listen for signed Lit Protocol access share link in URL hash
  useEffect(() => {
    const handleCheckHash = () => {
      if (typeof window !== "undefined" && window.location.hash.includes("lit_share=")) {
        const payload = parseLitShareableLink(window.location.hash);
        if (payload) {
          const match = documents.find(
            (d) => d.id === payload.docId || d.manifestCID === payload.manifestCID
          );
          if (match) {
            setSelectedDoc(match);
          } else {
            setSelectedDoc({
              id: payload.docId,
              manifestCID: payload.manifestCID,
              fileHash: payload.fileHash,
              manifestHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
              owner: payload.owner,
              createdAt: payload.issuedAt,
              updatedAt: payload.issuedAt,
              riskScore: 15,
              deleted: false,
              manifest: {
                version: 1,
                name: payload.fileName,
                size: 0,
                mimeType: "application/octet-stream",
                fileCID: payload.manifestCID,
                fileHash: payload.fileHash,
                iv: "0x000000000000000000000000",
                encryptedKey: "0xLitAccessGrant",
                metadata: {
                  uploadedAt: new Date(payload.issuedAt).toISOString(),
                  originalName: payload.fileName,
                  encryptionAlgorithm: "AES-GCM-256",
                  storageProvider: "Lighthouse (Filecoin/IPFS)",
                },
                accessControl: {
                  protocol: "lit-protocol-evm-access",
                  version: "1.0.0",
                  chain: "sepolia",
                  contractAddress: BLOCKNDRIVE_CONTRACT_ADDRESS,
                  ownerAddress: payload.owner,
                  condition: {
                    conditionType: "evmBasic",
                    contractAddress: BLOCKNDRIVE_CONTRACT_ADDRESS,
                    standardContractType: "Custom",
                    chain: "sepolia",
                    method: "isOwner",
                    parameters: [payload.docId.toString()],
                    returnValueTest: {
                      comparator: "=",
                      value: "true",
                    },
                  },
                },
                aiAnalysis: {
                  classification: "Lit Shared Access Document",
                  category: "Cryptographic Lit Share",
                  sensitivity: "Medium",
                  summary: "Document accessed via cryptographically signed Lit Protocol EVM access grant.",
                  detectedEntities: [],
                  complianceFlags: [],
                  riskScore: 15,
                  riskLevel: "LOW",
                  reasoning: `Cryptographically verified Lit access link issued by ${payload.owner.slice(0, 8)}...`,
                  creWorkflowId: "lit-shared-access",
                },
              },
            });
          }
          const isExpired = isLitPayloadExpired(payload);
          const remainingText = formatLitTimeRemaining(payload.expiresAt);
          if (isExpired) {
            setAuthNotification(`⚠️ Lit Protocol Access Link Expired: "${payload.fileName}"`);
          } else {
            setAuthNotification(`🔐 Verified Lit Protocol Access Link: "${payload.fileName}" (${remainingText})`);
          }
          setTimeout(() => setAuthNotification(null), 6000);
        }
      }
    };

    handleCheckHash();
    window.addEventListener("hashchange", handleCheckHash);
    return () => window.removeEventListener("hashchange", handleCheckHash);
  }, [documents]);

  const loadDocuments = async (targetAddress: string | null = wallet.address) => {
    setIsLoadingDocs(true);
    try {
      let mergedDocs: VaultDocument[] = [];

      // 1. Fetch persistent documents from Firestore indexed by wallet address
      if (targetAddress) {
        const firestoreDocs = await getUserDocumentsFromFirestore(targetAddress);
        if (firestoreDocs.length > 0) {
          mergedDocs = firestoreDocs;
        }
      }

      // 2. Fetch on-chain documents from Sepolia contract
      const onChainDocs = await fetchUserDocuments(targetAddress);

      // 3. Merge without duplicates (by fileHash or CID)
      const existingHashes = new Set(mergedDocs.map((d) => d.fileHash).filter(Boolean));
      const existingCIDs = new Set(mergedDocs.map((d) => d.manifestCID).filter(Boolean));

      for (const doc of onChainDocs) {
        const hasHashMatch = doc.fileHash && existingHashes.has(doc.fileHash);
        const hasCidMatch = doc.manifestCID && existingCIDs.has(doc.manifestCID);
        if (!hasHashMatch && !hasCidMatch) {
          mergedDocs.push(doc);
          if (doc.fileHash) existingHashes.add(doc.fileHash);
          if (doc.manifestCID) existingCIDs.add(doc.manifestCID);
        }
      }

      // 4. Guarantee 100% unique numeric IDs across all documents in state
      const seenIds = new Set<number>();
      let maxAssignedId = 0;
      for (const d of mergedDocs) {
        if (typeof d.id === "number" && !isNaN(d.id) && d.id > maxAssignedId) {
          maxAssignedId = d.id;
        }
      }

      const sanitizedDocs: VaultDocument[] = [];
      for (const doc of mergedDocs) {
        let finalId = doc.id;
        if (!finalId || isNaN(finalId) || seenIds.has(finalId)) {
          maxAssignedId++;
          finalId = maxAssignedId;
        }
        seenIds.add(finalId);
        sanitizedDocs.push(finalId === doc.id ? doc : { ...doc, id: finalId });
      }

      setDocuments(sanitizedDocs);
    } catch (err) {
      console.warn("Failed to load documents:", err);
      setDocuments(getStoredDocuments());
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Real-time on-chain event listener for 'DocumentRegistered' events
  useBlockchainEventListener({
    ownerAddress: wallet.address,
    enabled: true,
    onDocumentRegistered: (eventData) => {
      setAuthNotification(
        `⚡ On-Chain Event: Document #${eventData.documentId} Registered in real-time!`
      );
      setTimeout(() => setAuthNotification(null), 5000);

      if (eventData.document) {
        setDocuments((prev) => {
          const exists = prev.some(
            (d) =>
              d.id === eventData.documentId ||
              (d.fileHash && d.fileHash === eventData.fileHash) ||
              (d.manifestCID && d.manifestCID === eventData.manifestCID)
          );
          if (exists) {
            return prev.map((d) =>
              d.id === eventData.documentId || (d.fileHash && d.fileHash === eventData.fileHash)
                ? { ...d, ...eventData.document, id: eventData.documentId }
                : d
            );
          }
          return [eventData.document!, ...prev];
        });
      } else {
        loadDocuments(wallet.address);
      }
    },
    onDocumentDeleted: (docId) => {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, deleted: true, deletedAt: Date.now() } : d))
      );
    },
  });

  // Connect MetaMask (On-Chain Gas Tier)
  const handleConnect = async () => {
    try {
      const res = await connectMetaMask();
      const updatedWallet: WalletState = {
        isConnected: true,
        address: res.address,
        chainId: res.chainId,
        networkName: res.chainId === SEPOLIA_CHAIN_ID ? "Sepolia" : `Chain ${res.chainId}`,
        balance: res.balance,
        isMetaMaskAvailable: true,
      };
      setWallet(updatedWallet);
      setAuthNotification(`🦊 MetaMask Connected: ${res.address.slice(0, 6)}...${res.address.slice(-4)} (${res.balance} ETH)`);
      setTimeout(() => setAuthNotification(null), 5000);
      loadDocuments(res.address);
      setShowWalletModal(false);
    } catch (err: any) {
      console.warn("MetaMask connection failed:", err);
      setShowWalletModal(true);
      throw err;
    }
  };

  // Disconnect handler
  const handleDisconnect = () => {
    setWallet({
      isConnected: false,
      address: null,
      chainId: null,
      networkName: "",
      balance: null,
      isMetaMaskAvailable: typeof window !== "undefined" && !!window.ethereum,
    });
    setDocuments([]);
  };

  // Upload handler with on-chain & cloud persistence
  const handleUploadSuccess = async (newDoc: VaultDocument) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);

    // Save to Firestore indexed by wallet address
    const ownerAddr = wallet.address || newDoc.owner || "anonymous";
    try {
      await saveDocumentToFirestore(newDoc, ownerAddr);
    } catch (err) {
      console.warn("Could not sync document to Firestore:", err);
    }
  };

  // Archive (Soft-Delete) handler with Firestore cloud sync (24-hour retention)
  const handleDocumentDeleted = async (docId: number) => {
    const now = Date.now();
    const targetDoc = documents.find((d) => d.id === docId);
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, deleted: true, deletedAt: now } : d))
    );

    const ownerAddr = wallet.address || targetDoc?.owner || "anonymous";
    try {
      await deleteDocumentInFirestore(docId, ownerAddr, now);
    } catch (err) {
      console.warn("Could not archive document in Firestore:", err);
    }

    if (targetDoc) {
      logDocumentActivity({
        docId: docId,
        fileHash: targetDoc.fileHash,
        ownerId: ownerAddr,
        ownerAddress: targetDoc.owner || ownerAddr,
        action: "archive",
        title: "Document Moved to 24-Hour Archive",
        description: `Owner archived "${targetDoc.manifest?.name || `Doc #${docId}`}". Accessible for 24h recovery before automated purge.`,
        actor: `Owner (${wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "MetaMask User"})`,
        metadata: { archivedAt: new Date(now).toISOString() },
      });
    }
  };

  // Batch Archive handler
  const handleBatchDocumentsDeleted = async (docIds: number[]) => {
    const now = Date.now();
    const idSet = new Set(docIds);
    setDocuments((prev) =>
      prev.map((d) => (idSet.has(d.id) ? { ...d, deleted: true, deletedAt: now } : d))
    );

    const ownerAddr = wallet.address || "anonymous";
    for (const docId of docIds) {
      try {
        await deleteDocumentInFirestore(docId, ownerAddr, now);
      } catch (err) {
        console.warn("Could not archive document in Firestore:", err);
      }
    }

    docIds.forEach((docId) => {
      const targetDoc = documents.find((d) => d.id === docId);
      if (targetDoc) {
        logDocumentActivity({
          docId: docId,
          fileHash: targetDoc.fileHash,
          ownerId: ownerAddr,
          ownerAddress: targetDoc.owner || ownerAddr,
          action: "archive",
          title: "Batch Archive Operation",
          description: `Archived as part of batch operation.`,
          actor: `Owner (${wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "MetaMask User"})`,
        });
      }
    });
  };

  // Restore handler from Archive back to active
  const handleDocumentRestored = async (docId: number) => {
    const targetDoc = documents.find((d) => d.id === docId);
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, deleted: false, deletedAt: undefined } : d))
    );

    await restoreDocumentOnContract(docId);

    const ownerAddr = wallet.address || targetDoc?.owner || "anonymous";
    try {
      await restoreDocumentInFirestore(docId, ownerAddr);
    } catch (err) {
      console.warn("Could not restore document in Firestore:", err);
    }

    if (targetDoc) {
      logDocumentActivity({
        docId: docId,
        fileHash: targetDoc.fileHash,
        ownerId: ownerAddr,
        ownerAddress: targetDoc.owner || ownerAddr,
        action: "restore",
        title: "Document Restored to Active Vault",
        description: `Restored "${targetDoc.manifest?.name || `Doc #${docId}`}" from archive to active decentralized vault.`,
        actor: `Owner (${wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "MetaMask User"})`,
      });
    }
  };

  // Batch Restore handler
  const handleBatchDocumentsRestored = async (docIds: number[]) => {
    const idSet = new Set(docIds);
    setDocuments((prev) =>
      prev.map((d) => (idSet.has(d.id) ? { ...d, deleted: false, deletedAt: undefined } : d))
    );

    const ownerAddr = wallet.address || "anonymous";
    for (const docId of docIds) {
      await restoreDocumentOnContract(docId);
      try {
        await restoreDocumentInFirestore(docId, ownerAddr);
      } catch (err) {
        console.warn("Could not restore document in Firestore:", err);
      }
    }
  };

  // Permanent Delete handler
  const handleDocumentPermanentlyDeleted = async (docId: number) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));

    await permanentlyDeleteDocument(docId);

    const ownerAddr = wallet.address || "anonymous";
    try {
      await permanentlyDeleteDocumentInFirestore(docId, ownerAddr);
    } catch (err) {
      console.warn("Could not permanently delete document in Firestore:", err);
    }
  };

  // Batch Permanent Delete handler
  const handleBatchDocumentsPermanentlyDeleted = async (docIds: number[]) => {
    const idSet = new Set(docIds);
    setDocuments((prev) => prev.filter((d) => !idSet.has(d.id)));

    const ownerAddr = wallet.address || "anonymous";
    for (const docId of docIds) {
      await permanentlyDeleteDocument(docId);
      try {
        await permanentlyDeleteDocumentInFirestore(docId, ownerAddr);
      } catch (err) {
        console.warn("Could not permanently delete document in Firestore:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900/50 dark:selection:text-indigo-200 transition-colors">
      {/* Navigation Header */}
      <Navbar
        wallet={wallet}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onConnect={() => setShowWalletModal(true)}
        onDisconnect={handleDisconnect}
        onOpenWalletModal={() => setShowWalletModal(true)}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenFaucetModal={() => setShowFaucetModal(true)}
        onOpenDebug={() => setShowDebugModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Auth notification toast */}
        {authNotification && (
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{authNotification}</span>
          </div>
        )}

        {/* Public Onboarding & Welcome Hero for every visitor */}
        <PublicOnboardingHero
          wallet={wallet}
          onConnectMetaMask={() => setShowWalletModal(true)}
          onOpenShareModal={() => setShowShareModal(true)}
          onOpenFaucetModal={() => setShowFaucetModal(true)}
        />

        {/* Architecture & Web3 Security Status Bar */}
        <div className="my-6 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  On-Chain Gas Tier: MetaMask + Sepolia EVM + Lighthouse IPFS
                </span>
                {wallet.isConnected && wallet.address && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> On-Chain Verified
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                AES-256 In-Browser → Lighthouse Filecoin/IPFS → Lit Protocol Access → Sepolia Smart Contract
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Investor Pitch & 7 Core Pillars */}
            <button
              id="investor-pitch-status-btn"
              onClick={() => setShowOverviewModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="View Investor Deck, 7 Goals & Architecture"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Investor Deck</span>
            </button>

            <button
              onClick={() => setShowCREModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Cpu className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Chainlink CRE Metrics</span>
            </button>
          </div>
        </div>

        {/* Lighthouse IPFS Storage Quota Visualization */}
        <div className="mb-6">
          <StorageQuotaCard
            documents={documents}
            onRefresh={() => loadDocuments()}
            isLoading={isLoadingDocs}
          />
        </div>

        {/* Upload Document Section */}
        <UploadSection
          wallet={wallet}
          onUploadSuccess={handleUploadSuccess}
          onRequireConnect={() => setShowWalletModal(true)}
          onOpenFaucetModal={() => setShowFaucetModal(true)}
        />

        {/* Divider */}
        <div className="my-8 border-t border-slate-200/80 dark:border-slate-800" />

        {/* "My Documents" Section with Active & 24-Hour Archive View Modes */}
        <DocumentList
          documents={documents}
          wallet={wallet}
          isLoading={isLoadingDocs}
          onRefresh={() => loadDocuments()}
          onSelectDocument={(doc) => setSelectedDoc(doc)}
          onDocumentDeleted={handleDocumentDeleted}
          onBatchDocumentsDeleted={handleBatchDocumentsDeleted}
          onDocumentRestored={handleDocumentRestored}
          onBatchDocumentsRestored={handleBatchDocumentsRestored}
          onDocumentPermanentlyDeleted={handleDocumentPermanentlyDeleted}
          onBatchDocumentsPermanentlyDeleted={handleBatchDocumentsPermanentlyDeleted}
        />
      </main>

      {/* Document Details & Manifest Modal */}
      {selectedDoc && (
        <DocumentDetailsModal
          document={selectedDoc}
          wallet={wallet}
          onClose={() => setSelectedDoc(null)}
          onDownload={() => {
            setSelectedDoc(null);
          }}
          onOpenCREModal={() => {
            setSelectedDoc(null);
            setShowCREModal(true);
          }}
        />
      )}

      {/* Chainlink CRE Architecture Modal */}
      <ChainlinkCREModal
        isOpen={showCREModal}
        onClose={() => setShowCREModal(false)}
        contractAddress={BLOCKNDRIVE_CONTRACT_ADDRESS}
        forwarderAddress={CRE_FORWARDER_ADDRESS}
      />

      {/* Project Overview & 7 Goals Architecture Modal */}
      <ProjectOverviewModal
        isOpen={showOverviewModal}
        onClose={() => setShowOverviewModal(false)}
      />

      {/* Web3 MetaMask Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        wallet={wallet}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {/* Share App Modal */}
      <ShareAppModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        userAddress={wallet.address}
      />

      {/* Sepolia Free Gas Faucet Guide Modal */}
      <FaucetGuideModal
        isOpen={showFaucetModal}
        onClose={() => setShowFaucetModal(false)}
        walletAddress={wallet.address}
        balance={wallet.balance}
      />

      {/* Web3 Diagnostics & Debug Modal */}
      <DebugDiagnosticsModal
        isOpen={showDebugModal}
        onClose={() => setShowDebugModal(false)}
        walletAddress={wallet.address}
        chainId={wallet.chainId}
        balance={wallet.balance || "0.0000"}
      />

      {/* Network / Offline Monitor */}
      <OfflineIndicator />
    </div>
  );
}
