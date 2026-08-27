import { get, set, del, keys } from 'idb-keyval';

// Prefix system for user isolation
const getUserPrefix = (userId: string) => `user_${userId}_`;

// Key templates
const getVisitsCacheKey = (userId: string) => `${getUserPrefix(userId)}cached_promoter_visits`;
const getDraftKey = (userId: string, visitId: string, scheduledDate: string, industryId: string) => `${getUserPrefix(userId)}visit_draft_${visitId}_${scheduledDate}_${industryId}`;
const getSyncQueueKey = (userId: string) => `${getUserPrefix(userId)}sync_queue`;

export interface VisitDraft {
  visitId: string;
  industryId: string;
  scheduledDate: string;
  executorId: string;
  checkinAt: string;
  observation: string;
  evidences: any[];
  occurrences: any[];
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  lastSaved: string;
  status: 'offline_draft' | 'awaiting_connection' | 'awaiting_media' | 'ready_to_send' | 'sending' | 'sent' | 'failed';
  error?: string;
  requiredEvidenceTypes?: string[]; // Types that must be present
}

/**
 * Caches the promoter's visits for offline viewing.
 */
export async function cachePromoterVisits(userId: string, visits: any[]) {
  try {
    await set(getVisitsCacheKey(userId), {
      timestamp: new Date().toISOString(),
      data: visits
    });
  } catch (error) {
    console.error('Failed to cache visits:', error);
  }
}

export async function getCachedVisits(userId: string) {
  const cached = await get(getVisitsCacheKey(userId));
  return cached?.data || [];
}

/**
 * Saves a visit draft locally.
 */
export async function saveVisitDraft(userId: string, draft: Omit<VisitDraft, 'lastSaved' | 'status'> & { status?: VisitDraft['status'] }) {
  const currentDraft = await getVisitDraft(userId, draft.visitId, draft.scheduledDate, draft.industryId);
  
  const fullDraft: VisitDraft = {
    ...draft,
    lastSaved: new Date().toISOString(),
    status: draft.evidences && draft.evidences.length > 0 ? (currentDraft?.status === 'awaiting_media' ? 'awaiting_media' : 'offline_draft') : 'offline_draft',
    requiredEvidenceTypes: currentDraft?.requiredEvidenceTypes || ['replenishment'] // Default requirement
  };
  
  await set(getDraftKey(userId, draft.visitId, draft.scheduledDate, draft.industryId), fullDraft);
  return fullDraft;
}

export async function getVisitDraft(userId: string, visitId: string, scheduledDate: string, industryId: string): Promise<VisitDraft | null> {
  const exactKey = getDraftKey(userId, visitId, scheduledDate, industryId);
  const draft = await get(exactKey) as VisitDraft | null;
  if (import.meta.env.DEV) {
    const indexedDbKeys = (await keys()).filter((key) => typeof key === 'string' && (key.includes('visit_draft') || key.includes('evidence')));
    console.debug('[E4.8 IndexedDB read]', { exactKey, found: Boolean(draft), indexedDbKeys, userId, visitId, scheduledDate, industryId, evidenceCount: draft?.evidences?.length || 0, clientUploadIds: draft?.evidences?.map((e: any) => e.clientUploadId).filter(Boolean) || [], filePaths: draft?.evidences?.map((e: any) => e.filePath).filter(Boolean) || [] });
  }
  
  // Validate ownership
  if (draft && (draft.executorId !== userId || draft.visitId !== visitId || draft.scheduledDate !== scheduledDate || draft.industryId !== industryId)) {
    console.warn('Draft ownership mismatch detected and blocked.');
    return null;
  }
  
  return draft;
}

export async function deleteVisitDraft(userId: string, visitId: string, scheduledDate: string, industryId: string) {
  await del(getDraftKey(userId, visitId, scheduledDate, industryId));
}

/**
 * Sync Queue Management
 */
export async function addToSyncQueue(userId: string, visitId: string) {
  const key = getSyncQueueKey(userId);
  const queue = await get(key) as string[] || [];
  if (!queue.includes(visitId)) {
    await set(key, [...queue, visitId]);
  }
}

export async function getSyncQueue(userId: string): Promise<string[]> {
  return await get(getSyncQueueKey(userId)) as string[] || [];
}

export async function removeFromSyncQueue(userId: string, visitId: string) {
  const key = getSyncQueueKey(userId);
  const queue = await get(key) as string[] || [];
  await set(key, queue.filter((id: string) => id !== visitId));
}

/**
 * User data cleanup on logout
 */
export async function clearUserOfflineData(userId: string) {
  const allKeys = await keys();
  const userPrefix = getUserPrefix(userId);
  
  for (const key of allKeys) {
    if (typeof key === 'string' && key.startsWith(userPrefix)) {
      await del(key);
    }
  }
}

/**
 * Security cleanup for orphaned data (older than 7 days)
 */
export async function cleanupExpiredOfflineData() {
  const allKeys = await keys();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  for (const key of allKeys) {
    if (typeof key === 'string' && (key.includes('visit_draft_') || key.includes('cached_promoter_visits'))) {
      const data = await get(key);
      if (data?.lastSaved || data?.timestamp) {
        const date = new Date(data.lastSaved || data.timestamp);
        if (date < sevenDaysAgo) {
          await del(key);
        }
      }
    }
  }
}

/**
 * Helper to check online status
 */
export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}
