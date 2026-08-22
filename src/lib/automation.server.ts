import { createHmac } from 'crypto';

/**
 * Server-only utility to handle secure integration with n8n.
 */
export async function triggerAutomationEvent(eventType: string, data: any) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

  // 1. Get settings
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('automation_settings')
    .select('*')
    .eq('is_active', true)
    .single();

  if (settingsError || !settings?.n8n_webhook_url) {
    console.warn(`[Automation] No active webhook configured for event: ${eventType}`);
    return;
  }

  // 2. Prepare payload (Sanitized - no media URLs, just IDs and metadata)
  const timestamp = new Date().toISOString();
  const payload = {
    event: eventType,
    timestamp,
    data
  };

  // 3. Generate signature if secret exists
  let signature = '';
  if (settings.n8n_secret) {
    signature = createHmac('sha256', settings.n8n_secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  // 4. Send to n8n
  try {
    const response = await fetch(settings.n8n_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Project-Source': 'rota-do-promotor'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();

    // 5. Log attempt
    await supabaseAdmin.from('webhook_logs').insert({
      event_type: eventType,
      payload,
      status_code: response.status,
      response_body: responseText.substring(0, 1000)
    });

    return { success: response.ok, status: response.status };
  } catch (error: any) {
    console.error(`[Automation] Webhook failed for ${eventType}:`, error);

    // Log failure
    await supabaseAdmin.from('webhook_logs').insert({
      event_type: eventType,
      payload,
      error_message: error.message
    });

    return { success: false, error: error.message };
  }
}
