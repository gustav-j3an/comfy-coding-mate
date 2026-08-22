import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { triggerAutomationEvent } from "./automation.server";

export const getAutomationSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from('automation_settings' as any)
      .select('id, is_active, retention_days, authorized_domain, last_communication_at, last_test_result, active_events')
      .maybeSingle();

    if (error) throw error;
    
    // Return connection status based on environment variables (backend only check)
    const isConfigured = !!(process.env['N8N_WEBHOOK_URL']);
    
    return {
      ...(data || {
        retention_days: 90,
        is_active: false
      }),
      is_configured: isConfigured
    };
  });

export const updateAutomationSettings = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    retention_days: z.number().int().min(90, "Mínimo 90 dias conforme política de segurança"),
    is_active: z.boolean(),
    active_events: z.array(z.string()).optional()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: existing } = await supabaseAdmin
      .from('automation_settings' as any)
      .select('id')
      .maybeSingle();

    const payload = {
      retention_days: data.retention_days,
      is_active: data.is_active,
      active_events: data.active_events
    };

    if (existing) {
      const { data: updated, error } = await supabaseAdmin
        .from('automation_settings' as any)
        .update(payload as any)
        .eq('id', (existing as any).id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from('automation_settings' as any)
        .insert([payload as any])
        .select()
        .single();
      if (error) throw error;
      return inserted;
    }
  });

export const getWebhookLogs = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from('webhook_logs' as any)
      .select('id, event_type, status_code, error_message, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  });

export const testWebhook = createServerFn({ method: "POST" })
  .handler(async () => {
    return await triggerAutomationEvent('system.test', {
      message: 'Teste de conectividade segura.',
      timestamp: new Date().toISOString()
    });
  });

export const getCleanupPreview = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: settings } = await supabaseAdmin
      .from('automation_settings' as any)
      .select('retention_days')
      .maybeSingle();
      
    const retentionDays = (settings as any)?.retention_days || 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffStr = cutoffDate.toISOString();

    // Count records to be deleted
    const [visits, evidences, logs] = await Promise.all([
      supabaseAdmin.from('visits' as any).select('id', { count: 'exact', head: true }).lt('date', cutoffStr),
      supabaseAdmin.from('evidences' as any).select('id', { count: 'exact', head: true }).lt('created_at', cutoffStr),
      supabaseAdmin.from('webhook_logs' as any).select('id', { count: 'exact', head: true }).lt('created_at', cutoffStr)
    ]);

    return {
      visits: visits.count || 0,
      evidences: evidences.count || 0,
      logs: logs.count || 0,
      cutoff_date: cutoffStr
    };
  });

export const executeManualCleanup = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    confirmation: z.string().refine(val => val === 'EXCLUIR DADOS EXPIRADOS', {
      message: "Texto de confirmação incorreto"
    })
  }).parse(data))
  .handler(async ({ data }, ctx) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = (ctx as any).userId;

    // 1. Get counts for audit
    const preview = await getCleanupPreview();

    // 2. Perform cleanup with storage awareness
    // In a real scenario, we would iterate through evidences and delete files first.
    // For this implementation, we will simulate the safe sequence.
    
    // We'll use the existing cleanup_expired_data RPC if available, 
    // but the requirement is to ensure storage deletion.
    // Logic: 
    // a) Select evidences to delete
    // b) For each evidence, try to delete file from storage 'evidences' bucket
    // c) If successful, delete DB record.
    
    const { data: expiredEvidences } = await supabaseAdmin
      .from('evidences' as any)
      .select('id, image_url')
      .lt('created_at', preview.cutoff_date);

    let deletedFiles = 0;
    if (expiredEvidences && expiredEvidences.length > 0) {
      for (const evidence of expiredEvidences) {
        if (evidence.image_url) {
          // Extract file path from URL
          const filePath = evidence.image_url.split('/').pop();
          if (filePath) {
            const { error: storageError } = await supabaseAdmin.storage
              .from('evidences')
              .remove([filePath]);
            
            if (!storageError) {
              await supabaseAdmin.from('evidences' as any).delete().eq('id', evidence.id);
              deletedFiles++;
            } else {
              console.error(`Failed to delete storage file ${filePath}:`, storageError);
            }
          }
        }
      }
    }

    // 3. Clean up other records
    await supabaseAdmin.from('visits' as any).delete().lt('date', preview.cutoff_date);
    await supabaseAdmin.from('webhook_logs' as any).delete().lt('created_at', preview.cutoff_date);

    // 4. Audit entry
    await supabaseAdmin.from('cleanup_audit' as any).insert({
      admin_id: userId,
      records_count: { ...preview, deleted_files: deletedFiles },
      result: 'Success',
      confirmation_text: data.confirmation
    });

    await triggerAutomationEvent('system.manual_cleanup_executed', {
      admin_id: userId,
      deleted_files: deletedFiles
    });

    return { success: true, deleted_files: deletedFiles };
  });
