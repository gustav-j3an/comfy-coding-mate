import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getCleanupPreview = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffStr = cutoffDate.toISOString();

    const { count: visits } = await supabaseAdmin
      .from('visits')
      .select('id', { count: 'exact', head: true })
      .lt('date', cutoffStr);

    const { count: evidences } = await supabaseAdmin
      .from('visit_evidence' as any)
      .select('id', { count: 'exact', head: true })
      .lt('created_at', cutoffStr);

    const { count: logs } = await supabaseAdmin
      .from('webhook_logs' as any)
      .select('id', { count: 'exact', head: true })
      .lt('created_at', cutoffStr);

    return {
      visits: visits || 0,
      evidences: evidences || 0,
      logs: logs || 0,
      cutoff_date: cutoffStr
    };
  });

export const executeManualCleanup = createServerFn({ method: "POST" })
  .inputValidator((data: any) => z.object({
    confirmation: z.string().refine(val => val === 'EXCLUIR DADOS EXPIRADOS', {
      message: "Texto de confirmação incorreto"
    })
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = (context as any)?.userId;

    // 1. Get preview to know what we are deleting
    const preview = await getCleanupPreview();

    // 2. Perform cleanup with storage awareness
    const { data: expiredEvidences } = await supabaseAdmin
      .from('visit_evidence' as any)
      .select('id, file_path, visit_id')
      .lt('created_at', preview.cutoff_date);

    let deletedFiles = 0;
    if (expiredEvidences && expiredEvidences.length > 0) {
      for (const evidence of expiredEvidences as any[]) {
        // MISSION 9.1: Delete media even if linked to billing.
        // We only preserve the financial record, not the proof.
        if (evidence.file_path) {
          const { error: storageError } = await supabaseAdmin.storage
            .from('visit-evidences')
            .remove([evidence.file_path]);
          
          if (!storageError) {
            await supabaseAdmin.from('visit_evidence' as any).delete().eq('id', evidence.id);
            deletedFiles++;
          } else {
            console.error(`Failed to delete storage file ${evidence.file_path}:`, storageError);
          }
        }
      }
    }

    // 3. Clean up other records (occurrences, operational data)
    // Preservation rule now only applies to the billing_items record itself.
    const { data: visitsToDelete } = await supabaseAdmin
      .from('visits')
      .select('id')
      .lt('date', preview.cutoff_date);
    
    if (visitsToDelete && visitsToDelete.length > 0) {
      const visitIds = visitsToDelete.map(v => v.id);
      await supabaseAdmin.from('visits').delete().in('id', visitIds);
    }
    
    await supabaseAdmin.from('webhook_logs' as any).delete().lt('created_at', preview.cutoff_date);

    // 4. Audit entry
    await supabaseAdmin.from('cleanup_audit' as any).insert({
      admin_id: userId,
      records_count: { ...preview, deleted_files: deletedFiles },
      result: 'Success',
      confirmation_text: data.confirmation
    } as any);

    return { success: true, deleted_files: deletedFiles };
  });

export const updateAutomationSettings = createServerFn({ method: "POST" })
  .inputValidator((data: any) => z.object({
    retention_days: z.number().min(90, "Retenção mínima de 90 dias"),
    authorized_domains: z.array(z.string()),
    events_enabled: z.array(z.string())
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: currentSettings } = await supabaseAdmin.from('automation_settings' as any).select('id').maybeSingle();
    const settingsId = (currentSettings as any)?.id;
    
    const { data: settings, error } = await supabaseAdmin
      .from('automation_settings' as any)
      .update(data)
      .eq('id', settingsId)
      .select()
      .single();

    if (error) throw error;
    return settings;
  });

export const getAutomationSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from('automation_settings' as any)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data;
  });

export const getWebhookLogs = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from('webhook_logs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  });
