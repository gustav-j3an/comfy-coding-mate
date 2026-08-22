import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Submits a visit for audit, uploading metadata and creating occurrences.
 */
export const submitVisit = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    visitId: z.string(),
    executorId: z.string(),
    checkinAt: z.string(),
    checkoutAt: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    observation: z.string().optional(),
    evidences: z.array(z.object({
      filePath: z.string(),
      fileType: z.string(),
      evidenceType: z.string()
    })),
    occurrences: z.array(z.object({
      type: z.string(),
      industryId: z.string(),
      storeId: z.string(),
      description: z.string().optional(),
      productName: z.string().optional(),
      sku: z.string().optional(),
      batch: z.string().optional(),
      expiryDate: z.string().optional(),
      quantity: z.number().optional(),
      severity: z.string().default('attention')
    })).optional()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Update visit status and execution info
    const { error: visitError } = await supabaseAdmin
      .from('visits')
      .update({
        status: 'submitted',
        executor_id: data.executorId,
        checkin_at: data.checkinAt,
        checkout_at: data.checkoutAt,
        execution_latitude: data.latitude ?? null,
        execution_longitude: data.longitude ?? null,
        observation: data.observation || null
      } as any)
      .filter('id', 'eq', data.visitId);

    if (visitError) throw visitError;

    // 2. Insert evidences
    if (data.evidences.length > 0) {
      const evidencesToInsert = data.evidences.map(e => ({
        visit_id: data.visitId,
        file_path: e.filePath,
        file_type: e.fileType,
        evidence_type: e.evidenceType
      }));

      const { error: evidenceError } = await supabaseAdmin
        .from('visit_evidence')
        .insert(evidencesToInsert);
      
      if (evidenceError) throw evidenceError;
    }

    // 3. Insert occurrences
    if (data.occurrences && data.occurrences.length > 0) {
      const occurrencesToInsert = data.occurrences.map(o => ({
        visit_id: data.visitId,
        type: o.type,
        industry_id: o.industryId,
        store_id: o.storeId,
        description: o.description || null,
        product_name: o.productName || null,
        sku: o.sku || null,
        batch: o.batch || null,
        expiry_date: o.expiryDate || null,
        quantity: o.quantity || null,
        severity: o.severity,
        status: 'open'
      }));

      const { error: occurrenceError } = await (supabaseAdmin
        .from('occurrences') as any)
        .insert(occurrencesToInsert);
      
      if (occurrenceError) throw occurrenceError;
    }

    return { success: true };
  });

/**
 * Audits a visit (Approve/Reject).
 */
export const auditVisit = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    visitId: z.string(),
    auditorId: z.string(),
    decision: z.enum(['approved', 'rejected']),
    reason: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Update visit status
    const { error: visitError } = await supabaseAdmin
      .from('visits')
      .update({
        status: data.decision,
        rejection_reason: data.decision === 'rejected' ? (data.reason || null) : null
      } as any)
      .filter('id', 'eq', data.visitId);

    if (visitError) throw visitError;

    // 2. Record audit
    const { error: auditError } = await (supabaseAdmin
      .from('visit_audits') as any)
      .insert({
        visit_id: data.visitId,
        auditor_id: data.auditorId,
        decision: data.decision,
        reason: data.reason || null
      });

    if (auditError) throw auditError;

    return { success: true };
  });

/**
 * Gets a signed URL for a private evidence file.
 */
export const getSignedUrl = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({
    filePath: z.string()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: signedUrl, error } = await supabaseAdmin
      .storage
      .from('visit-evidences')
      .createSignedUrl(data.filePath, 3600); // 1 hour

    if (error) throw error;
    return signedUrl.signedUrl;
  });
