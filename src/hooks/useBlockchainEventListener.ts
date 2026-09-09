import { useEffect } from "react";
import {
  listenToDocumentRegistered,
  type DocumentRegisteredEventData,
  type DocumentDeletedCallback,
} from "../services/eventListener";

interface UseBlockchainEventListenerProps {
  ownerAddress?: string | null;
  onDocumentRegistered?: (eventData: DocumentRegisteredEventData) => void;
  onDocumentDeleted?: DocumentDeletedCallback;
  enabled?: boolean;
}

/**
 * React hook to automatically subscribe to 'DocumentRegistered' and on-chain document events
 */
export function useBlockchainEventListener({
  ownerAddress,
  onDocumentRegistered,
  onDocumentDeleted,
  enabled = true,
}: UseBlockchainEventListenerProps) {
  useEffect(() => {
    if (!enabled) return;

    const subscription = listenToDocumentRegistered({
      ownerAddress,
      onDocumentRegistered: (eventData) => {
        console.log("[Blockchain Event] DocumentRegistered:", eventData);
        if (onDocumentRegistered) {
          onDocumentRegistered(eventData);
        }
      },
      onDocumentDeleted: (docId, owner, txHash) => {
        console.log("[Blockchain Event] DocumentDeleted:", { docId, owner, txHash });
        if (onDocumentDeleted) {
          onDocumentDeleted(docId, owner, txHash);
        }
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [ownerAddress, enabled, onDocumentRegistered, onDocumentDeleted]);
}
