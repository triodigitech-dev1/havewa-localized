"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from "lucide-react";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  getPendingCount,
  syncOfflineQueue,
} from "@/lib/offline-sync";
import { Button } from "@/components/ui/button";

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, startSync] = useTransition();

  const refreshCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // Ignore reading error
    }
  }, []);

  const handleSync = useCallback(() => {
    startSync(async () => {
      try {
        const result = await syncOfflineQueue();
        await refreshCount();
        if (result.synced > 0) {
          toast.success(
            `Synchronized ${result.synced} offline item${result.synced > 1 ? "s" : ""} successfully!`
          );
        } else if (result.failed > 0) {
          toast.error(
            `Failed to sync ${result.failed} items: ${result.errors.join(", ") || "Unknown error"}`
          );
        }
      } catch {
        toast.error("Failed to synchronize offline data.");
      }
    });
  }, [refreshCount]);

  useEffect(() => {
    void refreshCount();

    const handleQueueUpdate = () => {
      void refreshCount();
    };

    window.addEventListener("localea:offline-queue-updated", handleQueueUpdate);
    return () => {
      window.removeEventListener("localea:offline-queue-updated", handleQueueUpdate);
    };
  }, [refreshCount]);

  // When connection transitions back online, auto-sync pending items
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      handleSync();
    }
  }, [isOnline, pendingCount, isSyncing, handleSync]);

  // If online and no items pending, render nothing
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex flex-wrap items-center gap-2 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 text-white px-3.5 py-2 text-xs font-medium shadow-2xl border border-slate-700/60 backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2"
    >
      {!isOnline ? (
        <div className="flex items-center gap-2 text-amber-300">
          <WifiOff className="size-4 animate-pulse text-amber-400" />
          <span>Offline Mode</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>Connected</span>
        </div>
      )}

      {pendingCount > 0 && (
        <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2 text-slate-300">
          <CloudUpload className="size-3.5 text-sky-400" />
          <span>
            {pendingCount} change{pendingCount > 1 ? "s" : ""} pending
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSync}
            disabled={!isOnline || isSyncing}
            className="h-6 px-2 text-[11px] font-semibold text-white hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className={`size-3 mr-1 ${isSyncing ? "animate-spin text-sky-400" : ""}`} />
            {isSyncing ? "Syncing…" : "Sync Now"}
          </Button>
        </div>
      )}
    </div>
  );
};
