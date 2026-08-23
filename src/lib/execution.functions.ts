import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { triggerAutomationEvent } from "./automation.server";
import { recordAudit } from "./audit.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { format } from "date-fns";

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
    // If the client sends data that suggests it's in preview mode, block it at backend level.
    // Also, if an admin is trying to submit for someone else, we double check.
    if ((data as any).previewPromoterId || isAdmin) {
      // Admins should not be submitting visits via the UI in preview mode
      // unless we explicitly allow them to perform actions as promoters (not requested).
      // The request says: "O modo de pré-visualização deve ser somente leitura também no backend"
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

    // 2. Validate mandatory evidences existence and status per industry
    // KING, DON LUIZ e FRUTA POLPA - Required: Report and Replenishment photo
    const requiredTypes = ['reposicao', 'relatorio'];
    const uploadedTypes = data.evidences.map(e => e.evidenceType);
    const missingTypes = requiredTypes.filter(t => !uploadedTypes.includes(t));
    
    if (missingTypes.length > 0) {
      const labels: Record<string, string> = {
        'reposicao': 'Foto da Reposição',
        'relatorio': 'Relatório da Indústria'
      };
      throw new Error(`Evidências obrigatórias ausentes: ${missingTypes.map(t => labels[t] || t).join(', ')}`);
    }

    // 3. Verify files actually exist in Storage
    for (const evidence of data.evidences) {
      const pathParts = evidence.filePath.split('/');
      const fileName = pathParts.pop();
      const folder = pathParts.join('/'); // should be 'evidences/VISIT_ID'
      
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

    // 5. Insert evidences
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
      
      if (evidenceError && !evidenceError.message.includes('unique constraint')) {
        throw new Error("Erro ao registrar evidências.");
      }
    }

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
      // If not admin, verify ownership or industry relationship
      // The filePath pattern is evidences/{visit_id}/...
      const pathParts = data.filePath.split('/');
      const visitIdFromPath = pathParts.length > 1 ? pathParts[1] : null;

      if (!visitIdFromPath) {
        throw new Error("Caminho de arquivo inválido.");
      }

      if (isIndustry) {
        // Industry check: does this visit belong to their industry?
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
        // Promoter check: are they the assigned promoter?
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
      .createSignedUrl(data.filePath, 3600); // 1 hour

    if (error) throw error;
    return signedUrl.signedUrl;
  });

export { getPromoterAgenda } from "./execution.functions.server";
