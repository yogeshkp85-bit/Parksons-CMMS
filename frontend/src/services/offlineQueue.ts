/**
 * offlineQueue.ts
 * Saves breakdown form payloads to localStorage when the browser is offline.
 * Automatically flushes the queue when the connection is restored.
 *
 * Usage in BreakdownEntry.tsx:
 *   import { enqueueOffline, flushOfflineQueue, getOfflineQueueCount } from '../services/offlineQueue';
 */

import api from './api';

const QUEUE_KEY = 'cmms_offline_queue';

export interface OfflineEntry {
  id: string;           // locally generated uuid
  timestamp: string;    // ISO string when the entry was saved offline
  payload: Record<string, any>;
}

/** Save one breakdown payload to the offline queue */
export function enqueueOffline(payload: Record<string, any>): void {
  const queue = getQueue();
  const entry: OfflineEntry = {
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    payload,
  };
  queue.push(entry);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Returns all pending offline entries */
export function getQueue(): OfflineEntry[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** How many entries are waiting to be synced */
export function getOfflineQueueCount(): number {
  return getQueue().length;
}

/** Remove one entry from the queue by its local id */
function dequeue(id: string): void {
  const queue = getQueue().filter((e) => e.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Try to submit all queued entries to the backend.
 * Entries that succeed are removed. Failed ones stay for next attempt.
 * Returns { sent, failed } counts.
 */
export async function flushOfflineQueue(): Promise<{ sent: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const entry of queue) {
    try {
      await api.post('/breakdowns/create', {
        ...entry.payload,
        offlineQueueId: entry.id,   // informational, backend ignores unknown fields
        offlineTimestamp: entry.timestamp,
      });
      dequeue(entry.id);
      sent++;
    } catch {
      failed++;
      // Leave in queue — will retry on next flush
    }
  }

  return { sent, failed };
}

/**
 * Register a global listener that auto-flushes the queue when the
 * browser comes back online. Call once at app startup (in main.tsx or App.tsx).
 * Returns a cleanup function to remove the listener.
 */
export function registerOnlineListener(
  onFlushed?: (result: { sent: number; failed: number }) => void
): () => void {
  const handler = async () => {
    const result = await flushOfflineQueue();
    if (result.sent > 0 || result.failed > 0) {
      onFlushed?.(result);
    }
  };
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}
