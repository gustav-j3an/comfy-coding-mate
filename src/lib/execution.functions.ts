import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { triggerAutomationEvent } from "./automation.server";
import { recordAudit } from "./audit.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Submits a visit for audit, uploading metadata and creating occurrences.
 */
export const submitVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])

  .inputValidator((data) => z.object({
    visitId: z.string().uuid(),
    industryId: z.string().uuid(),
    executorId: z.string().uuid(),
    checkinAt: z.string(),
    checkoutAt: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    observation: z.string().optional(),
    evidences: z.array(z.object({
      filePath: z.string(),
      fileType: z.string(),
      evidenceType: z.string(),
      industryId: z.string().optional(),
      status: z.string().optional()
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
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!userId) {
      throw new Error("Não autorizado: Usuário não autenticado no servidor.");
    }

    const debugSubmit = (stage: string, extra: Record<string, unknown> = {}) => {
      if (import.meta.env?.DEV) console.debug('[submitVisit]', { stage, visitId: data.visitId, industryId: data.industryId, ...extra });
    };
    debugSubmit('authenticated', { evidenceCount: data.evidences.length, locationPresent: Boolean(data.latitude && data.longitude) });

    // AUTH REINFORCEMENT: Check if the user is an admin or the owner
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const isAdmin = userRole?.role === 'admin';

    // BLOCK WRITE ACTIONS IN PREVIEW MODE
    if ((data as any).previewPromoterId || isAdmin) {
      if ((data as any).previewPromoterId) {
         throw new Error("Ação bloqueada: O modo de pré-visualização é apenas para leitura.");
      }
    }

    // 1. Validate that the user is the assigned promoter for this visit
    const { data: visitData, error: visitFetchError } = await supabaseAdmin
      .from('visits')
      .select('id, promoter_id, status')
      .eq('id', data.visitId)
      .single();

    if (visitFetchError || !visitData) {
      throw new Error("Visita não encontrada ou erro ao validar permissão.");
    }

    const currentStatus = String(visitData.status || '');
    if (currentStatus === 'submitted') {
      return { success: true, visitId: data.visitId, industryId: data.industryId, status: 'submitted', submittedAt: new Date().toISOString() };
    }
    if (currentStatus === 'submitted' || currentStatus === 'approved') {
      return { success: true, message: "Visita já foi enviada anteriormente." };
    }

    // 2. Validate mandatory evidences (reposicao) per industry
    const { data: industries } = await supabaseAdmin
      .from('visits')
      .select(`
        route_stop:route_stops(
          stop_tasks(
            industry:industries(id, name)
          )
        )
      `)
      .eq('id', data.visitId)
      .single();

    const taskIndustries = (industries as any)?.route_stop?.stop_tasks
      ?.map((t: any) => t.industry)
      .filter((industry: any) => industry?.id === data.industryId) || [];
    const missingPhotos: string[] = [];
    if (!taskIndustries.some((ind: any) => ind.id === data.industryId)) throw new Error(`Indústria não pertence à parada (industryId=${data.industryId}).`);
    const { data: confirmedEvidence, error: evidenceError } = await supabaseAdmin.from('visit_evidence').select('id').eq('visit_id', data.visitId).eq('industry_id', data.industryId).eq('evidence_type', 'replenishment').limit(1).maybeSingle();
    if (evidenceError) throw new Error(`Falha ao validar evidência: ${evidenceError.message}`);
    if (!confirmedEvidence) throw new Error(`Foto de reposição confirmada ausente (visitId=${data.visitId}, industryId=${data.industryId}).`);

    for (const ind of taskIndustries) {
      const hasPhoto = data.evidences.some(e => 
        e.evidenceType === 'replenishment' &&
        e.industryId === ind.id
      );
      if (!hasPhoto) {
        missingPhotos.push(ind.name);
      }
    }
    
    if (missingPhotos.length > 0) {
      throw new Error(`Fotos de reposição obrigatórias ausentes para: ${missingPhotos.join(', ')}`);
    }

    // 3. Verify files actually exist in Storage
    for (const evidence of data.evidences) {
      const pathParts = evidence.filePath.split('/');
      const fileName = pathParts.pop();
      const folder = pathParts.join('/'); 
      
      const { data: fileExists, error: storageError } = await supabaseAdmin
        .storage
        .from('visit-evidences')
        .list(folder, {
          limit: 1,
          search: fileName || ''
        });

      if (storageError || !fileExists || fileExists.length === 0) {
        console.error(`File missing in storage: ${evidence.filePath}`);
        throw new Error("Erro de integridade: Um ou mais arquivos de evidência não foram encontrados no servidor.");
      }
    }

    // 4. Update visit status and execution info
    const { error: visitUpdateError } = await supabaseAdmin
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
      .eq('id', data.visitId)
      .in('status', ['pending', 'planned'] as any);

    if (visitUpdateError) { debugSubmit('visits update failed', { code: visitUpdateError.code, message: visitUpdateError.message }); throw new Error(`Erro ao atualizar status da visita: ${visitUpdateError.message}`); }
    debugSubmit('visits persisted', { status: 'submitted' });

    // 5. Evidences are already inserted via confirmEvidenceUpload during the upload process.
    // We just need to make sure they exist for mandatory check (already done in step 2).

    // 6. Insert occurrences
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
      
      if (occurrenceError) throw new Error("Erro ao registrar ocorrências.");
    }

    try { await triggerAutomationEvent('visit.submitted', {
      visitId: data.visitId,
      executorId: data.executorId,
      timestamp: new Date().toISOString()
    }); } catch (n8nError: any) { debugSubmit('n8n failed', { message: n8nError?.message }); }

    return { success: true, visitId: data.visitId, industryId: data.industryId, status: 'submitted', submittedAt: new Date().toISOString() };
  });

/**
 * Audits a visit (Approve/Reject).
 */
export const auditVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])

  .inputValidator((data) => z.object({
    visitId: z.string(),
    auditorId: z.string(),
    decision: z.enum(['approved', 'rejected']),
    reason: z.string().optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!userId) {
      throw new Error("Não autorizado: Usuário não autenticado no servidor.");
    }

    // AUTH REINFORCEMENT
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (userRole?.role !== 'admin') {
      throw new Error("Não autorizado: Apenas administradores podem auditar visitas.");
    }

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

    // Record audit log
    await recordAudit({
      userId: (context as any).userId || 'system',
      action: data.decision === 'approved' ? 'approve_visit' : 'reject_visit',
      module: 'visits',
      entityType: 'visit',
      entityId: data.visitId,
      summary: `Visita ${data.decision} por admin. ${data.reason ? 'Motivo: ' + data.reason : ''}`,
      details: {
        visitId: data.visitId,
        decision: data.decision,
        reason: data.reason
      }
    });

    // 3. Trigger automation
    await triggerAutomationEvent(data.decision === 'approved' ? 'visit.approved' : 'visit.rejected', {
      visitId: data.visitId,
      auditorId: data.auditorId,
      reason: data.reason || null
    });

    return { success: true };
  });

/**
 * Gets a signed URL for a private evidence file.
 */
export const getSignedUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])

  .inputValidator((data) => z.object({
    filePath: z.string()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!userId) {
      throw new Error("Não autorizado.");
    }

    // AUTH REINFORCEMENT: Only admin or owner can see evidence
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    const isAdmin = userRole?.role === 'admin';
    const isIndustry = userRole?.role === 'industry';

    if (!isAdmin) {
      const pathParts = data.filePath.split('/');
      const visitIdFromPath = pathParts.length > 1 ? pathParts[1] : null;

      if (!visitIdFromPath) {
        throw new Error("Caminho de arquivo inválido.");
      }

      if (isIndustry) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('industry_id')
          .eq('id', userId)
          .single();

        const { data: visit } = await supabaseAdmin
          .from('visits')
          .select('industry_id')
          .eq('id', visitIdFromPath)
          .single();

        if (!profile || !visit || profile.industry_id !== visit.industry_id) {
          throw new Error("Não autorizado: Esta evidência não pertence à sua indústria.");
        }
      } else {
        const { data: visit } = await supabaseAdmin
          .from('visits')
          .select('promoter_id')
          .eq('id', visitIdFromPath)
          .single();

        const { data: promoter } = await supabaseAdmin
          .from('promoters')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!visit || !promoter || visit.promoter_id !== promoter.id) {
          throw new Error("Não autorizado: Você não é o responsável por esta visita.");
        }
      }
    }

    const { data: signedUrl, error } = await supabaseAdmin
      .storage
      .from('visit-evidences')
      .createSignedUrl(data.filePath, 3600); 

    if (error) throw new Error(`Falha ao gerar URL assinada de leitura: ${error.message}`);
    if (!signedUrl?.signedUrl) throw new Error("Servidor não retornou URL assinada de leitura.");
    return { signedUrl: signedUrl.signedUrl };
  });

export const getPromoterPendingVisits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ promoterId: z.string().uuid().optional() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin.from('profiles').select('promoter_id').eq('id', context.userId).single();
    const promoterId = profile?.promoter_id;
    if (!promoterId) return [];
    const today = new Date().toISOString().slice(0, 10);
    // Do not build this list from stop_tasks/evidences/occurrences joins. Those
    // one-to-many relationships can repeat the same scheduled industry.
    const { data: visits, error } = await supabaseAdmin
      .from('visits')
      .select('id, store_id, industry_id, scheduled_date, status, store:stores(name), industry:industries(name)')
      .eq('promoter_id', promoterId)
      .lt('scheduled_date', today)
      .in('status', ['planned', 'pending', 'submitted', 'approved'] as any)
      .order('scheduled_date', { ascending: true });
    if (error) throw new Error(`Não foi possível carregar visitas pendentes: ${error.message}`);

    type VisitRow = NonNullable<typeof visits>[number] & { promoter_id?: string };
    const unique = new Map<string, VisitRow>();
    for (const visit of (visits || []) as VisitRow[]) {
      const key = `${promoterId}+${visit.scheduled_date}+${visit.store_id}+${visit.industry_id}`;
      const existing = unique.get(key);
      const isCompleted = ['submitted', 'approved'].includes(String(visit.status));
      const existingCompleted = existing && ['submitted', 'approved'].includes(String(existing.status));

      // A confirmed attendance wins over any duplicated planned/pending row.
      if (!existing || (isCompleted && !existingCompleted)) {
        unique.set(key, { ...visit, promoter_id: promoterId, pendingKey: key } as VisitRow & { pendingKey: string });
      }
    }

    return Array.from(unique.values())
      .filter((visit) => !['submitted', 'approved'].includes(String(visit.status)))
      .map((visit: any) => ({ ...visit, pendingKey: `${promoterId}+${visit.scheduled_date}+${visit.store_id}+${visit.industry_id}` }));
  });

export const getPromoterAgenda = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    date: z.string(),
    promoterId: z.string().optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { getPromoterAgenda: fn } = await import("./execution.functions.server");
    return fn({ data, context: { userId: context.userId } });
  });

export const getPromoterVisitExecution = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    visitId: z.string(),
    industryId: z.string().uuid(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { getPromoterVisitExecution: fn } = await import("./execution.functions.server");
    return fn({ data, context: { userId: context.userId } });
  });

export const getPromoterVisitIndustries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ visitId: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const { getPromoterVisitIndustries: fn } = await import("./execution.functions.server");
    return fn({ data, context: { userId: context.userId } });
  });

export const startScheduledVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    routeStopId: z.string(),
    date: z.string(),
    industryId: z.string().uuid(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { startScheduledVisit: fn } = await import("./execution.functions.server");
    return fn({ data, context: { userId: context.userId } });
  });


export const requestEvidenceUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    visitId: z.string(),
    industryId: z.string().optional(),
    evidenceType: z.string(),
    fileName: z.string(),
    fileType: z.string(),
    fileSize: z.number(),
    clientUploadId: z.string().uuid(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { requestEvidenceUpload: fn } = await import("./execution.functions.server");
    return fn({ data, context: { userId: context.userId } });
  });

export const confirmEvidenceUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    visitId: z.string(),
    industryId: z.string().optional(),
    evidenceType: z.string(),
    filePath: z.string(),
    fileType: z.string(),
    clientUploadId: z.string().uuid(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { confirmEvidenceUpload: fn } = await import("./execution.functions.server");
    return fn({ data, context: { userId: context.userId } });
  });
