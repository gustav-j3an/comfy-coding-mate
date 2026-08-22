import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getDiagnosticStatus = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check Supabase connection
    const { error: supabaseError } = await supabaseAdmin
      .from('profiles' as any)
      .select('id', { count: 'exact', head: true })
      .limit(1);

    // Check Automation Settings
    const { data: automationSettings } = await supabaseAdmin
      .from('automation_settings' as any)
      .select('*')
      .maybeSingle();

    // Check Storage
    const { data: buckets, error: storageError } = await supabaseAdmin.storage.listBuckets();
    const evidenceBucket = buckets?.find(b => b.name === 'evidences');

    // Check Last Cleanup
    const { data: lastCleanup } = await supabaseAdmin
      .from('cleanup_audit' as any)
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Environment variables status
    const n8nConfigured = !!process.env['N8N_WEBHOOK_URL'] && !!process.env['N8N_HMAC_SECRET'];

    return {
      supabase: {
        status: !supabaseError ? 'ok' : 'error',
        message: supabaseError?.message
      },
      automation: {
        status: n8nConfigured ? 'ok' : 'missing_env',
        last_event: (automationSettings as any)?.last_communication_at
      },
      storage: {
        status: evidenceBucket ? 'ok' : 'error',
        message: storageError?.message
      },
      cleanup: {
        last_run: (lastCleanup as any)?.created_at
      },
      version: '1.0.0-mission9'
    };
  });
