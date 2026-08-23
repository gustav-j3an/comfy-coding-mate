import { get, set, del } from 'idb-keyval';
import { toast } from 'sonner';

// Keys for IndexedDB
const VISITS_CACHE_KEY = 'cached_promoter_visits';
const DRAFTS_PREFIX = 'visit_draft_';
const SYNC_QUEUE_KEY = 'sync_queue';

export interface VisitDraft {
  visitId: string;
  executorId: string;
  checkinAt: string;
  observation: string;
  evidences: any[];
  occurrences: any[];
  latitude?: number | null;
  longitude?: number | null;
  lastSaved: string;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

/**
 * Caches the promoter's visits for offline viewing.
 * Rule: Only stores visits for the authenticated promoter.
 */
export async function cachePromoterVisits(visits: any[]) {
  try {
    await set(VISITS_CACHE_KEY, {
      timestamp: new Date().toISOString(),
      data: visits
    });
  } catch (error) {
    console.error('Failed to cache visits:', error);
  }
}

export async function getCachedVisits() {
  const cached = await get(VISITS_CACHE_KEY);
  return cached?.data || [];
}

/**
 * Saves a visit draft locally.
 */
export async function saveVisitDraft(draft: Omit<VisitDraft, 'lastSaved' | 'status'>) {
  const fullDraft: VisitDraft = {
    ...draft,
    lastSaved: new Date().toISOString(),
    status: 'pending'
  };
  
  await set(`${DRAFTS_PREFIX}${draft.visitId}`, fullDraft);
  return fullDraft;
}

export async function getVisitDraft(visitId: string): Promise<VisitDraft | null> {
  return await get(`${DRAFTS_PREFIX}${visitId}`) || null;
}

export async function deleteVisitDraft(visitId: string) {
  await del(`${DRAFTS_PREFIX}${visitId}`);
}

/**
 * Sync Queue Management
 */
export async function addToSyncQueue(visitId: string) {
  const queue = await get(SYNC_QUEUE_KEY) || [];
  if (!queue.includes(visitId)) {
    await set(SYNC_QUEUE_KEY, [...queue, visitId]);
  }
}

export async function getSyncQueue(): Promise<string[]> {
  return await get(SYNC_QUEUE_KEY) || [];
}

export async function removeFromSyncQueue(visitId: string) {
  const queue = await get(SYNC_QUEUE_KEY) || [];
  await set(SYNC_QUEUE_KEY, queue.filter((id: string) => id !== visitId));
}

/**
 * Helper to check online status
 */
export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}
