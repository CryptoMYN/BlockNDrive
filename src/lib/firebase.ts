import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  orderBy,
  type Firestore,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import type { VaultDocument } from "../types";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with configured databaseId
export const db: Firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || "(default)"
);

// Connection verification (skill requirement)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration or internet connectivity.");
    }
  }
}

// Trigger initial test
testConnection();

export interface FirebaseUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  walletAddress?: string | null;
  createdAt: string;
  lastLoginAt: string;
}

/**
 * Sign in using Google popup
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Firebase Google Sign-In error:", error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Sync user profile to Firestore
 */
export async function syncUserProfile(user: User, walletAddress?: string | null): Promise<void> {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const now = new Date().toISOString();

  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      walletAddress: walletAddress || null,
      createdAt: now,
      lastLoginAt: now,
    });
  } else {
    await setDoc(
      userRef,
      {
        lastLoginAt: now,
        ...(walletAddress ? { walletAddress } : {}),
      },
      { merge: true }
    );
  }
}

/**
 * Persist document metadata and IPFS CID to Firestore
 */
export async function saveDocumentToFirestore(
  docData: VaultDocument,
  userId: string
): Promise<void> {
  const docRef = doc(db, "documents", `doc_${docData.id}_${docData.fileHash.slice(0, 10)}`);
  
  await setDoc(
    docRef,
    {
      id: `doc_${docData.id}`,
      onChainId: docData.id,
      ownerId: userId,
      ownerAddress: docData.owner,
      name: docData.manifest?.name || `document_${docData.id}`,
      size: docData.manifest?.size || 0,
      mimeType: docData.manifest?.mimeType || "application/octet-stream",
      fileCID: docData.manifest?.fileCID || "",
      manifestCID: docData.manifestCID,
      fileHash: docData.fileHash,
      manifestHash: docData.manifestHash,
      riskScore: docData.riskScore,
      riskLevel: docData.manifest?.aiAnalysis.riskLevel || (docData.riskScore >= 80 ? "HIGH" : docData.riskScore >= 50 ? "MEDIUM" : "LOW"),
      aiSummary: docData.manifest?.aiAnalysis.summary || "",
      classification: docData.manifest?.aiAnalysis.classification || "General Document",
      category: docData.manifest?.aiAnalysis.category || "General",
      encryptedKey: docData.manifest?.encryptedKey || "",
      createdAt: new Date(docData.createdAt).toISOString(),
      isDeleted: false,
      manifest: docData.manifest || null,
    },
    { merge: true }
  );
}

/**
 * Fetch documents for a user from Firestore (including active and 24h-archived documents)
 */
export async function getUserDocumentsFromFirestore(userId: string): Promise<VaultDocument[]> {
  try {
    const q = query(
      collection(db, "documents"),
      where("ownerId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const docs: VaultDocument[] = [];
    const now = Date.now();
    const RETENTION_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

    snapshot.forEach((snapDoc) => {
      const data = snapDoc.data();
      if (data.permanentlyDeleted) {
        return; // Ignore permanently deleted
      }

      const isDeleted = Boolean(data.isDeleted);
      const deletedAt = data.deletedAt ? Number(data.deletedAt) : undefined;

      // If deleted more than 24 hours ago, auto-expire
      if (isDeleted && deletedAt && now - deletedAt >= RETENTION_PERIOD_MS) {
        return;
      }

      docs.push({
        id: data.onChainId ?? Number(data.id.replace("doc_", "")) ?? 1,
        manifestCID: data.manifestCID,
        fileHash: data.fileHash,
        manifestHash: data.manifestHash,
        owner: data.ownerAddress,
        createdAt: new Date(data.createdAt).getTime(),
        updatedAt: new Date(data.createdAt).getTime(),
        riskScore: data.riskScore ?? 15,
        deleted: isDeleted,
        deletedAt: deletedAt,
        permanentlyDeleted: false,
        manifest: data.manifest || {
          name: data.name,
          size: data.size,
          mimeType: data.mimeType,
          fileCID: data.fileCID,
          fileHash: data.fileHash,
          createdAt: data.createdAt,
          encryptedKey: data.encryptedKey,
          aiAnalysis: {
            classification: data.classification,
            category: data.category,
            sensitivity: data.riskLevel === "HIGH" ? "Critical" : "Medium",
            summary: data.aiSummary,
            detectedEntities: [],
            complianceFlags: [],
            riskScore: data.riskScore,
            riskLevel: data.riskLevel,
            reasoning: "",
            creWorkflowId: "",
          },
        },
      });
    });

    return docs.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.warn("Firestore fetch documents error:", err);
    return [];
  }
}

/**
 * Move document to 24-hour Archive in Firestore (soft-delete with timestamp)
 */
export async function deleteDocumentInFirestore(
  docId: number,
  userId: string,
  deletedAt = Date.now()
): Promise<void> {
  try {
    const q = query(
      collection(db, "documents"),
      where("ownerId", "==", userId),
      where("onChainId", "==", docId)
    );
    const snap = await getDocs(q);
    for (const docItem of snap.docs) {
      await setDoc(docItem.ref, { isDeleted: true, deletedAt }, { merge: true });
    }
  } catch (err) {
    console.warn("Failed to archive document in Firestore:", err);
  }
}

/**
 * Restore document from Archive back to active in Firestore
 */
export async function restoreDocumentInFirestore(docId: number, userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, "documents"),
      where("ownerId", "==", userId),
      where("onChainId", "==", docId)
    );
    const snap = await getDocs(q);
    for (const docItem of snap.docs) {
      await setDoc(docItem.ref, { isDeleted: false, deletedAt: null }, { merge: true });
    }
  } catch (err) {
    console.warn("Failed to restore document in Firestore:", err);
  }
}

/**
 * Permanently delete document from Firestore so user never sees it again
 */
export async function permanentlyDeleteDocumentInFirestore(
  docId: number,
  userId: string
): Promise<void> {
  try {
    const q = query(
      collection(db, "documents"),
      where("ownerId", "==", userId),
      where("onChainId", "==", docId)
    );
    const snap = await getDocs(q);
    for (const docItem of snap.docs) {
      await setDoc(docItem.ref, { permanentlyDeleted: true, isDeleted: true }, { merge: true });
    }
  } catch (err) {
    console.warn("Failed to permanently delete document in Firestore:", err);
  }
}
