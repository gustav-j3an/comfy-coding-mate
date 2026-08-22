import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { triggerAutomationEvent } from "./automation.server";

export const getAutomationSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from('automation_settings' as any)
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  });

export const updateAutomationSettings = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    n8n_webhook_url: z.string().url("URL inválida").optional().nullable(),
    n8n_secret: z.string().optional().nullable(),
    retention_days: z.number().int().min(1, "Mínimo 1 dia"),
    is_active: z.boolean(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // We only have one settings record
    const { data: existing } = await supabaseAdmin
      .from('automation_settings' as any)
      .select('id')
      .single();

    if (existing) {
      const { data: updated, error } = await supabaseAdmin
        .from('automation_settings' as any)
        .update(data as any)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from('automation_settings' as any)
        .insert([data as any])
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
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  });

export const testWebhook = createServerFn({ method: "POST" })
  .handler(async () => {
    return await triggerAutomationEvent('system.test', {
      message: 'Este é um teste de conectividade do sistema Rota do Promotor.',
      timestamp: new Date().toISOString()
    });
  });

export const runRetentionCleanup = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // We trigger the Postgres function via RPC if possible, 
    // or just run a query that calls it.
    const { data, error } = await supabaseAdmin.rpc('cleanup_expired_data');
    
    if (error) throw error;

    await triggerAutomationEvent('system.cleanup_executed', {
      timestamp: new Date().toISOString()
    });

    return { success: true };
  });
