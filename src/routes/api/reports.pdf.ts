import { createFileRoute } from '@tanstack/react-router';
import { requireSupabaseAuth } from '@/lib/auth/supabase-auth.server';

export const Route = createFileRoute('/api/reports/pdf')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Authenticate the user
        let session;
        try {
          const auth = await requireSupabaseAuth({ request });
          session = auth.session;
        } catch (error) {
          return new Response('Unauthorized', { status: 401 });
        }

        const url = new URL(request.url);
        const industryId = url.searchParams.get('industryId');
        const month = url.searchParams.get('month');
        const year = url.searchParams.get('year');

        if (!industryId || !month || !year) {
          return new Response('Missing parameters', { status: 400 });
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        
        // 1. Verify existence of published report (Security check)
        const { data: report, error: reportError } = await (supabaseAdmin
          .from('monthly_reports' as any) as any)
          .select('*, industry:industries(name)')
          .eq('industry_id', industryId)
          .eq('month', parseInt(month))
          .eq('year', parseInt(year))
          .eq('status', 'publicado')
          .single();

        if (reportError || !report) {
          return new Response('Report not found or not published', { status: 404 });
        }

        // 2. Authorization check: Industry user can only see their own reports
        const { data: roleData } = await (supabaseAdmin
          .from('user_roles' as any) as any)
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (roleData?.role === 'industry') {
          const { data: industry } = await (supabaseAdmin
            .from('industries' as any) as any)
            .select('id')
            .eq('contact_email', session.user.email)
            .single();
          
          if (!industry || industry.id !== industryId) {
            return new Response('Forbidden', { status: 403 });
          }
        }

        // Mock PDF response - in a real implementation we would use a PDF generation lib
        const html = `
          <html>
            <body style="font-family: sans-serif; padding: 40px; color: #333;">
              <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; color: #1e293b;">Relatório Mensal de Execução</h1>
                <p style="margin: 5px 0 0 0; color: #64748b; font-weight: bold; text-transform: uppercase;">
                  ${report.industry.name} | ${month}/${year}
                </p>
              </div>
              
              <div style="display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 40px;">
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                  <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">EXECUÇÃO</div>
                  <div style="font-size: 24px; font-weight: bold;">${Math.round((report.total_visits_sent / report.total_visits_planned) * 100)}%</div>
                </div>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                  <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">VISITAS APROVADAS</div>
                  <div style="font-size: 24px; font-weight: bold;">${report.total_visits_approved}</div>
                </div>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                  <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">LOJAS ATENDIDAS</div>
                  <div style="font-size: 24px; font-weight: bold;">${report.stores_served} / ${report.stores_planned}</div>
                </div>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                  <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">OCORRÊNCIAS</div>
                  <div style="font-size: 24px; font-weight: bold;">${report.occurrences_count}</div>
                </div>
              </div>

              <h3>Resumo de Ocorrências</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                <tr style="background: #f1f5f9;">
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">Tipo</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">Qtd</th>
                </tr>
                ${Object.entries(report.occurrences_by_type || {}).map(([type, count]) => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${type}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: right;">${count}</td>
                  </tr>
                `).join('')}
              </table>

              <div style="font-size: 10px; color: #94a3b8; text-align: center; margin-top: 100px;">
                Gerado em ${new Date().toLocaleString('pt-BR')} | Rota do Promotor - Portal Executivo
              </div>
            </body>
          </html>
        `;

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          }
        });
      }
    }
  }
});
