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
      evidenceType: z.string(),
      industryId: z.string().optional()
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

    if (visitData.status === 'submitted' || visitData.status === 'approved') {
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

    const taskIndustries = (industries as any)?.route_stop?.stop_tasks?.map((t: any) => t.industry) || [];
    const missingPhotos: string[] = [];

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
      .filter('id', 'eq', data.visitId);

    if (visitUpdateError) throw new Error("Erro ao atualizar status da visita.");

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

    await triggerAutomationEvent('visit.submitted', {
      visitId: data.visitId,
      executorId: data.executorId,
      timestamp: new Date().toISOString()
    });

    return { success: true };
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

    if (error) throw error;
    return signedUrl.signedUrl;
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
    industryId: z.string().uuid().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { getPromoterVisitExecution: fn } = await import("./execution.functions.server");
    return fn({ data, context: { userId: context.userId } });
  });

export const startScheduledVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    routeStopId: z.string(),
    date: z.string(),
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
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { confirmEvidenceUpload: fn } = await import("./execution.functions.server");
    return fn({ data, context: { userId: context.userId } });
  });
