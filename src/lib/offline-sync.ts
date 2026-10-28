/**
 * Localea Offline Indexing & Background Synchronization Engine
 *
 * Provides resilient offline storage (IndexedDB with transparent localStorage fallback),
 * offline action queueing, data caching for offline viewing, and automatic
 * synchronization when connectivity is restored.
 */

export interface OfflineQueueItem {
  id: string;
  actionType: string;
  endpoint: string;
  payload: Record<string, unknown>;
  description: string;
  createdAt: number;
  status: "pending" | "syncing" | "failed" | "completed";
  retryCount: number;
  error?: string;
}

const DB_NAME = "localea_offline_db";
const DB_VERSION = 1;
const QUEUE_STORE = "offline_queue";
const INDEX_STORE = "offline_cache";
const LOCAL_STORAGE_KEY = "localea_offline_queue_fallback";
const LOCAL_CACHE_KEY = "localea_offline_cache_fallback";

// Open or initialize IndexedDB safely
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available in current environment"));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(INDEX_STORE)) {
        db.createObjectStore(INDEX_STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open IndexedDB"));
  });
}

function notifyQueueChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("localea:offline-queue-updated"));
  }
}

// Fallback helpers for LocalStorage
function getLocalFallbackQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalFallbackQueue(items: OfflineQueueItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    notifyQueueChanged();
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Enqueue an action when offline or when an immediate submit fails due to network issues
 */
export async function enqueueOfflineItem(
  params: Omit<OfflineQueueItem, "id" | "createdAt" | "status" | "retryCount">
): Promise<OfflineQueueItem> {
  const item: OfflineQueueItem = {
    ...params,
    id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    status: "pending",
    retryCount: 0,
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, "readwrite");
      tx.objectStore(QUEUE_STORE).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    notifyQueueChanged();
  } catch {
    // Use fallback
    const items = getLocalFallbackQueue();
    items.push(item);
    saveLocalFallbackQueue(items);
  }

  return item;
}

/**
 * Retrieve all items in the offline submission queue
 */
export async function getOfflineQueue(): Promise<OfflineQueueItem[]> {
  try {
    const db = await openDB();
    return await new Promise<OfflineQueueItem[]>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, "readonly");
      const req = tx.objectStore(QUEUE_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return getLocalFallbackQueue();
  }
}

/**
 * Get count of pending items waiting to be synced
 */
export async function getPendingCount(): Promise<number> {
  const items = await getOfflineQueue();
  return items.filter((i) => i.status === "pending" || i.status === "failed").length;
}

/**
 * Delete a specific queue item
 */
export async function removeOfflineItem(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, "readwrite");
      tx.objectStore(QUEUE_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    notifyQueueChanged();
  } catch {
    const items = getLocalFallbackQueue().filter((i) => i.id !== id);
    saveLocalFallbackQueue(items);
  }
}

/**
 * Clear all successfully completed sync items
 */
export async function clearCompletedItems(): Promise<void> {
  const items = await getOfflineQueue();
  const remaining = items.filter((i) => i.status !== "completed");
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, "readwrite");
      const store = tx.objectStore(QUEUE_STORE);
      store.clear();
      for (const item of remaining) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    notifyQueueChanged();
  } catch {
    saveLocalFallbackQueue(remaining);
  }
}

/**
 * Update an item's status in the queue
 */
export async function updateItemStatus(
  id: string,
  status: OfflineQueueItem["status"],
  error?: string
): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, "readwrite");
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.get(id);
      req.onsuccess = () => {
        const item: OfflineQueueItem | undefined = req.result;
        if (item) {
          item.status = status;
          if (error !== undefined) item.error = error;
          if (status === "failed") item.retryCount += 1;
          store.put(item);
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
    notifyQueueChanged();
  } catch {
    const items = getLocalFallbackQueue();
    const target = items.find((i) => i.id === id);
    if (target) {
      target.status = status;
      if (error !== undefined) target.error = error;
      if (status === "failed") target.retryCount += 1;
      saveLocalFallbackQueue(items);
    }
  }
}

/**
 * Cache entities for offline indexing and instant offline inspection
 */
export async function cacheOfflineData<T>(key: string, data: T): Promise<void> {
  const payload = { key, data, updatedAt: Date.now() };
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(INDEX_STORE, "readwrite");
      tx.objectStore(INDEX_STORE).put(payload);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    try {
      const existing = JSON.parse(localStorage.getItem(LOCAL_CACHE_KEY) || "{}");
      existing[key] = payload;
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(existing));
    } catch {
      // Ignore quota error
    }
  }
}

/**
 * Retrieve cached entity data when offline
 */
export async function getCachedOfflineData<T = unknown>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return await new Promise<T | null>((resolve) => {
      const tx = db.transaction(INDEX_STORE, "readonly");
      const req = tx.objectStore(INDEX_STORE).get(key);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    try {
      const existing = JSON.parse(localStorage.getItem(LOCAL_CACHE_KEY) || "{}");
      return existing[key]?.data ?? null;
    } catch {
      return null;
    }
  }
}

/**
 * Process all pending offline submissions by syncing them to the server
 */
export async function syncOfflineQueue(): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0, errors: ["Device is offline"] };
  }

  const allItems = await getOfflineQueue();
  const pendingItems = allItems.filter(
    (item) => item.status === "pending" || item.status === "failed"
  );

  if (pendingItems.length === 0) {
    return { synced: 0, failed: 0, errors: [] };
  }

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  // Mark pending items as syncing
  for (const item of pendingItems) {
    await updateItemStatus(item.id, "syncing");
  }

  try {
    const res = await fetch("/api/offline-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: pendingItems }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Sync server error");
      for (const item of pendingItems) {
        await updateItemStatus(item.id, "failed", errText);
      }
      return { synced: 0, failed: pendingItems.length, errors: [errText] };
    }

    const json = (await res.json()) as {
      results: Array<{ id: string; success: boolean; error?: string }>;
    };

    for (const r of json.results) {
      if (r.success) {
        await updateItemStatus(r.id, "completed");
        // Automatically delete completed item after a short delay
        await removeOfflineItem(r.id);
        synced++;
      } else {
        await updateItemStatus(r.id, "failed", r.error || "Submission failed");
        failed++;
        if (r.error) errors.push(r.error);
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Network error during sync";
    for (const item of pendingItems) {
      await updateItemStatus(item.id, "failed", errMsg);
    }
    return { synced: 0, failed: pendingItems.length, errors: [errMsg] };
  }

  notifyQueueChanged();
  return { synced, failed, errors };
}
