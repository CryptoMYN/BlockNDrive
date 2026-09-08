import React, { useState, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Navbar } from "./components/Navbar";
import { UploadSection } from "./components/UploadSection";
import { DocumentList } from "./components/DocumentList";
import { DocumentDetailsModal } from "./components/DocumentDetailsModal";
import { ChainlinkCREModal } from "./components/ChainlinkCREModal";
import { StorageQuotaCard } from "./components/StorageQuotaCard";
import { ProjectOverviewModal } from "./components/ProjectOverviewModal";
import { useTheme } from "./hooks/useTheme";
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
  auth,
  signInWithGoogle,
  signOutUser,
  syncUserProfile,
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
} from "./constants/contract";
import {
  ShieldCheck,
  Cpu,
  Database,
  ExternalLink,
  HardDrive,
  Sparkles,
  Cloud,
  CheckCircle2,
  LogIn,
} from "lucide-react";

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: true, // Default to demo connected for instantaneous testability
    address: "0x71C...Demo",
    chainId: 11155111,
    networkName: "Sepolia Testnet",
    balance: "1.450",
    isMetaMaskAvailable: typeof window !== "undefined" && !!window.ethereum,
    isDemoMode: true,
  });

  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);
  const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);
  const [showCREModal, setShowCREModal] = useState<boolean>(false);
  const [showOverviewModal, setShowOverviewModal] = useState<boolean>(false);
  const [authNotification, setAuthNotification] = useState<string | null>(null);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfile(user, wallet.address);
        // Load documents from Firestore for this user
        loadDocuments(user);
      } else {
        // Fallback to local / blockchain documents
        loadDocuments(null);
      }
    });

    return () => unsubscribe();
  }, [wallet.address]);

  // Check if MetaMask is available on mount
  useEffect(() => {
    const hasMetaMask = typeof window !== "undefined" && !!window.ethereum;
    setWallet((prev) => ({ ...prev, isMetaMaskAvailable: hasMetaMask }));

    // Auto-listen for account or chain changes if user already authorized MetaMask
    if (hasMetaMask && window.ethereum) {
      window.ethereum.on?.("accountsChanged", (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setWallet((prev) => ({
            ...prev,
            isConnected: true,
            address: accounts[0],
            isDemoMode: false,
          }));
        } else {
          setWallet((prev) => ({
            ...prev,
            isConnected: false,
            address: null,
            balance: null,
          }));
        }
      });

      window.ethereum.on?.("chainChanged", () => {
        window.location.reload();
      });
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
                name: payload.fileName,
                size: 0,
                mimeType: "application/octet-stream",
                fileCID: payload.manifestCID,
                fileHash: payload.fileHash,
                createdAt: new Date(payload.issuedAt).toISOString(),
                encryptedKey: "0xLitAccessGrant",
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

  const loadDocuments = async (activeUser: User | null = currentUser) => {
    setIsLoadingDocs(true);
    try {
      let mergedDocs: VaultDocument[] = [];

      // 1. If user is signed in to Firebase, load persistent documents from Firestore
      if (activeUser) {
        const firestoreDocs = await getUserDocumentsFromFirestore(activeUser.uid);
        if (firestoreDocs.length > 0) {
          mergedDocs = firestoreDocs;
        }
      }

      // 2. Fetch on-chain documents
      const onChainDocs = await fetchUserDocuments(wallet.address, wallet.isDemoMode);

      // 3. Merge without duplicates (by fileHash or id)
      const existingHashes = new Set(mergedDocs.map((d) => d.fileHash));
      for (const doc of onChainDocs) {
        if (!existingHashes.has(doc.fileHash)) {
          mergedDocs.push(doc);
          existingHashes.add(doc.fileHash);
        }
      }

      setDocuments(mergedDocs);
    } catch (err) {
      console.warn("Failed to load documents:", err);
      setDocuments(getStoredDocuments());
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Google Sign-In with Firebase Auth
  const handleSignInGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      setCurrentUser(user);
      await syncUserProfile(user, wallet.address);
      setAuthNotification(`Signed in as ${user.displayName || user.email}`);
      setTimeout(() => setAuthNotification(null), 4000);
      loadDocuments(user);
    } catch (err: any) {
      alert(`Google Sign-In failed: ${err.message || "Unknown error"}`);
    }
  };

  const handleSignOutGoogle = async () => {
    try {
      await signOutUser();
      setCurrentUser(null);
      setAuthNotification("Signed out successfully");
      setTimeout(() => setAuthNotification(null), 3000);
      loadDocuments(null);
    } catch (err: any) {
      console.error("Sign-out error:", err);
    }
  };

  // Connect MetaMask
  const handleConnect = async () => {
    try {
      const res = await connectMetaMask();
      const updatedWallet: WalletState = {
        isConnected: true,
        address: res.address,
        chainId: res.chainId,
        networkName: res.chainId === 11155111 ? "Sepolia" : `Chain ${res.chainId}`,
        balance: res.balance,
        isMetaMaskAvailable: true,
        isDemoMode: false,
      };
      setWallet(updatedWallet);
      if (currentUser) {
        syncUserProfile(currentUser, res.address);
      }
      loadDocuments();
    } catch (err: any) {
      alert(err.message || "Failed to connect wallet. Switching to Demo Mode.");
      handleEnableDemo();
    }
  };

  const handleDisconnect = () => {
    setWallet({
      isConnected: false,
      address: null,
      chainId: null,
      networkName: "",
      balance: null,
      isMetaMaskAvailable: typeof window !== "undefined" && !!window.ethereum,
      isDemoMode: false,
    });
  };

  const handleEnableDemo = () => {
    setWallet({
      isConnected: true,
      address: "0x71C...Demo",
      chainId: 11155111,
      networkName: "Sepolia Testnet",
      balance: "2.500",
      isMetaMaskAvailable: typeof window !== "undefined" && !!window.ethereum,
      isDemoMode: true,
    });
    loadDocuments();
  };

  // Upload handler with Firestore cloud persistence
  const handleUploadSuccess = async (newDoc: VaultDocument) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);

    // Save to Firestore if user is authenticated
    if (currentUser) {
      try {
        await saveDocumentToFirestore(newDoc, currentUser.uid);
      } catch (err) {
        console.warn("Could not sync document to Firestore:", err);
      }
    }
  };

  // Archive (Soft-Delete) handler with Firestore cloud sync (24-hour retention)
  const handleDocumentDeleted = async (docId: number) => {
    const now = Date.now();
    const targetDoc = documents.find((d) => d.id === docId);
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, deleted: true, deletedAt: now } : d))
    );

    if (currentUser) {
      try {
        await deleteDocumentInFirestore(docId, currentUser.uid, now);
      } catch (err) {
        console.warn("Could not archive document in Firestore:", err);
      }
    }

    if (targetDoc) {
      logDocumentActivity({
        docId: docId,
        fileHash: targetDoc.fileHash,
        ownerId: currentUser?.uid || wallet.address,
        ownerAddress: targetDoc.owner || wallet.address,
        action: "archive",
        title: "Document Moved to 24-Hour Archive",
        description: `Owner archived "${targetDoc.manifest?.name || `Doc #${docId}`}". Accessible for 24h recovery before automated purge.`,
        actor: `Owner (${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)})`,
        metadata: { archivedAt: new Date(now).toISOString() },
      });
    }
  };

  // Batch Archive handler with Firestore cloud sync
  const handleBatchDocumentsDeleted = async (docIds: number[]) => {
    const now = Date.now();
    const idSet = new Set(docIds);
    setDocuments((prev) =>
      prev.map((d) => (idSet.has(d.id) ? { ...d, deleted: true, deletedAt: now } : d))
    );

    if (currentUser) {
      for (const docId of docIds) {
        try {
          await deleteDocumentInFirestore(docId, currentUser.uid, now);
        } catch (err) {
          console.warn("Could not archive document in Firestore:", err);
        }
      }
    }

    docIds.forEach((docId) => {
      const targetDoc = documents.find((d) => d.id === docId);
      if (targetDoc) {
        logDocumentActivity({
          docId: docId,
          fileHash: targetDoc.fileHash,
          ownerId: currentUser?.uid || wallet.address,
          ownerAddress: targetDoc.owner || wallet.address,
          action: "archive",
          title: "Batch Archive Operation",
          description: `Archived as part of batch operation.`,
          actor: `Owner (${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)})`,
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

    await restoreDocumentOnContract(docId, wallet.isDemoMode);

    if (currentUser) {
      try {
        await restoreDocumentInFirestore(docId, currentUser.uid);
      } catch (err) {
        console.warn("Could not restore document in Firestore:", err);
      }
    }

    if (targetDoc) {
      logDocumentActivity({
        docId: docId,
        fileHash: targetDoc.fileHash,
        ownerId: currentUser?.uid || wallet.address,
        ownerAddress: targetDoc.owner || wallet.address,
        action: "restore",
        title: "Document Restored to Active Vault",
        description: `Restored "${targetDoc.manifest?.name || `Doc #${docId}`}" from archive to active decentralized vault.`,
        actor: `Owner (${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)})`,
      });
    }
  };

  // Batch Restore handler
  const handleBatchDocumentsRestored = async (docIds: number[]) => {
    const idSet = new Set(docIds);
    setDocuments((prev) =>
      prev.map((d) => (idSet.has(d.id) ? { ...d, deleted: false, deletedAt: undefined } : d))
    );

    for (const docId of docIds) {
      await restoreDocumentOnContract(docId, wallet.isDemoMode);
      if (currentUser) {
        try {
          await restoreDocumentInFirestore(docId, currentUser.uid);
        } catch (err) {
          console.warn("Could not restore document in Firestore:", err);
        }
      }
    }
  };

  // Permanent Delete handler (purged forever so user never sees it again)
  const handleDocumentPermanentlyDeleted = async (docId: number) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));

    await permanentlyDeleteDocument(docId, wallet.isDemoMode);

    if (currentUser) {
      try {
        await permanentlyDeleteDocumentInFirestore(docId, currentUser.uid);
      } catch (err) {
        console.warn("Could not permanently delete document in Firestore:", err);
      }
    }
  };

  // Batch Permanent Delete handler
  const handleBatchDocumentsPermanentlyDeleted = async (docIds: number[]) => {
    const idSet = new Set(docIds);
    setDocuments((prev) => prev.filter((d) => !idSet.has(d.id)));

    for (const docId of docIds) {
      await permanentlyDeleteDocument(docId, wallet.isDemoMode);
      if (currentUser) {
        try {
          await permanentlyDeleteDocumentInFirestore(docId, currentUser.uid);
        } catch (err) {
          console.warn("Could not permanently delete document in Firestore:", err);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900/50 dark:selection:text-indigo-200 transition-colors">
      {/* Navigation Header */}
      <Navbar
        wallet={wallet}
        currentUser={currentUser}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onToggleDemoMode={handleEnableDemo}
        onSignInGoogle={handleSignInGoogle}
        onSignOutGoogle={handleSignOutGoogle}
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

        {/* Architecture & Firebase Cloud Persistence Status Bar */}
        <div className="my-6 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  7-Phase Decentralized Architecture + Firestore Cloud Persistence
                </span>
                {currentUser && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <Cloud className="h-2.5 w-2.5" /> Synced
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                AES-256 Browser Encryption → Lighthouse Filecoin → Lit Access Control → Chainlink CRE AI → Firestore Sync
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!currentUser && (
              <button
                onClick={handleSignInGoogle}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <LogIn className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Sign in with Google to sync cloud</span>
              </button>
            )}

            <button
              onClick={() => setShowCREModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Cpu className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Chainlink CRE Inspector</span>
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

        {/* PHASE 1 - 7: Upload Document Section */}
        <UploadSection
          wallet={wallet}
          onUploadSuccess={handleUploadSuccess}
          onRequireConnect={handleConnect}
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
        documents={documents}
        onSelectDocument={(doc) => {
          setShowCREModal(false);
          setSelectedDoc(doc);
        }}
      />

      {/* Project Overview & 7 Goals Architecture Modal */}
      <ProjectOverviewModal
        isOpen={showOverviewModal}
        onClose={() => setShowOverviewModal(false)}
        onOpenCREModal={() => setShowCREModal(true)}
      />

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-auto text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowOverviewModal(true)}
              className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>BlockNDrive Vault</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono">
                7 Goals
              </span>
            </button>
            <span>•</span>
            <span>Smart Contract:</span>
            <a
              href={`https://sepolia.etherscan.io/address/${BLOCKNDRIVE_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              0xb52c...0580
            </a>
          </div>

          <div className="flex items-center gap-4 text-[11px] flex-wrap">
            <button
              onClick={() => setShowOverviewModal(true)}
              className="hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
            >
              Architecture & Goals
            </button>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Cloud className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              Firestore Cloud Active
            </span>
            <span>•</span>
            <span>Lighthouse IPFS Node Active</span>
            <span>•</span>
            <span>CRE Keystone Forwarder: 0xF834...4482</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
