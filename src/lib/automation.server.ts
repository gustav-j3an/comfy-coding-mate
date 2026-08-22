import { createHmac } from 'crypto';

/**
 * Server-only utility to handle secure integration with n8n.
 * Secrets are read from environment variables to avoid exposure in DB or UI.
 */
export async function triggerAutomationEvent(eventType: string, data: any) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

  // 1. Get configuration from environment variables
  const N8N_WEBHOOK_URL = process.env['N8N_WEBHOOK_URL'];
  const N8N_HMAC_SECRET = process.env['N8N_HMAC_SECRET'];
  const AUTHORIZED_DOMAIN = process.env['AUTHORIZED_DOMAIN'] || '';

  // 2. Check if automation is active in settings (metadata only)
  const { data: settings } = await supabaseAdmin
    .from('automation_settings' as any)
    .select('*')
    .eq('is_active', true)
    .maybeSingle();

  if (!settings || !N8N_WEBHOOK_URL) {
    console.warn(`[Automation] No active webhook configured via ENV for event: ${eventType}`);
    return;
  }

  // 3. Validate URL (HTTPS and authorized domain)
  try {
    const url = new URL(N8N_WEBHOOK_URL);
    if (url.protocol !== 'https:') {
      throw new Error("Webhook URL must be HTTPS");
    }
    if (AUTHORIZED_DOMAIN && !url.hostname.endsWith(AUTHORIZED_DOMAIN)) {
      throw new Error(`Domain ${url.hostname} is not authorized`);
    }
  } catch (err: any) {
    console.error(`[Automation] Invalid Webhook URL: ${err.message}`);
    return;
  }

  // 4. Prepare payload (Sanitized)
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = {
    event: eventType,
    timestamp,
    // Sanitize data: remove potentially sensitive strings if they look like tokens/secrets
    data: sanitizePayloadData(data)
  };

  // 5. Generate signature with timestamp (Protection against replay attacks)
  let signature = '';
  if (N8N_HMAC_SECRET) {
    // We sign the combination of timestamp and payload
    const signPayload = `${timestamp}.${JSON.stringify(payload)}`;
    signature = createHmac('sha256', N8N_HMAC_SECRET)
      .update(signPayload)
      .digest('hex');
  }

  // 6. Send to n8n
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': timestamp.toString(),
        'X-Project-Source': 'rota-do-promotor'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();

    // 7. Update last communication metadata
    await supabaseAdmin.from('automation_settings' as any).update({
      last_communication_at: new Date().toISOString(),
      last_test_result: response.ok ? 'Success' : `Error: ${response.status}`
    } as any).eq('id', (settings as any).id);

    // 8. Log attempt (Sanitized)
    await supabaseAdmin.from('webhook_logs' as any).insert({
      event_type: eventType,
      payload: sanitizePayloadForLog(payload),
      status_code: response.status,
      response_body: response.ok ? 'OK' : responseText.substring(0, 500)
    });

    return { success: response.ok, status: response.status };
  } catch (error: any) {
    console.error(`[Automation] Webhook failed for ${eventType}:`, error);

    // Log failure
    await supabaseAdmin.from('webhook_logs' as any).insert({
      event_type: eventType,
      payload: sanitizePayloadForLog(payload),
      error_message: "Network or configuration error"
    });

    return { success: false, error: "Integration error" };
  }
}

/**
 * Removes sensitive fields from the data payload before sending to n8n.
 */
function sanitizePayloadData(data: any): any {
  if (!data) return data;
  const sanitized = { ...data };
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'email'];
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      // Mask email but keep domain if useful, or just mask entirely
      if (key.toLowerCase().includes('email') && typeof sanitized[key] === 'string') {
        const [user, domain] = sanitized[key].split('@');
        sanitized[key] = `${user[0]}***@${domain}`;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    }
  }
  return sanitized;
}

/**
 * Further sanitizes the payload before storing it in the database logs.
 */
function sanitizePayloadForLog(payload: any): any {
  // Logs should be even more restrictive
  return {
    event: payload.event,
    timestamp: payload.timestamp,
    data_keys: Object.keys(payload.data || {})
  };
}
