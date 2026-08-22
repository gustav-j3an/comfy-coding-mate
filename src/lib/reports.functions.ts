import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getReports = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from('monthly_reports')
      .select(`
        *,
        industry:industries(name)
      `)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) throw error;
    return data;
  });

export const createReportSnapshot = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    industryId: z.string(),
    month: z.number(),
    year: z.number()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const startDate = new Date(data.year, data.month - 1, 1).toISOString();
    const endDate = new Date(data.year, data.month, 0).toISOString();

    // 1. Fetch real-time metrics
    const [visitsRes, occurrencesRes] = await Promise.all([
      supabaseAdmin
        .from('visits')
        .select('id, status, store_id')
        .filter('industry_id', 'eq', data.industryId)
        .filter('scheduled_date', 'gte', startDate)
        .filter('scheduled_date', 'lte', endDate),
      supabaseAdmin
        .from('occurrences')
        .select('id, type')
        .filter('industry_id', 'eq', data.industryId)
        .filter('created_at', 'gte', startDate)
        .filter('created_at', 'lte', endDate)
    ]);

    if (visitsRes.error) throw visitsRes.error;
    if (occurrencesRes.error) throw occurrencesRes.error;

    const visits = visitsRes.data || [];
    const occurrences = occurrencesRes.data || [];

    const stats = {
      total_visits_planned: visits.length,
      total_visits_sent: visits.filter(v => ['submitted', 'approved', 'rejected'].includes(v.status)).length,
      total_visits_approved: visits.filter(v => v.status === 'approved').length,
      total_visits_rejected: visits.filter(v => v.status === 'rejected').length,
      total_visits_pending: visits.filter(v => v.status === 'pending').length,
      stores_planned: new Set(visits.map(v => v.store_id)).size,
      stores_served: new Set(visits.filter(v => v.status !== 'pending').map(v => v.store_id)).size,
      occurrences_count: occurrences.length,
      occurrences_by_type: occurrences.reduce((acc: any, curr) => {
        const type = curr.type || 'outros';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };

    // 2. Upsert the report
    const { data: report, error: reportError } = await supabaseAdmin
      .from('monthly_reports')
      .upsert({
        industry_id: data.industryId,
        month: data.month,
        year: data.year,
        status: 'em_montagem',
        ...stats,
        updated_at: new Date().toISOString()
      } as any)
      .select()
      .single();

    if (reportError) throw reportError;
    return report;
  });

export const publishReport = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    reportId: z.string()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from('monthly_reports')
      .update({
        status: 'publicado',
        published_at: new Date().toISOString()
      } as any)
      .filter('id', 'eq', data.reportId);

    if (error) throw error;
    return { success: true };
  });

export const getIndustryReports = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({
    industryEmail: z.string()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Get industry ID first
    const { data: industry, error: indError } = await supabaseAdmin
      .from('industries')
      .select('id')
      .filter('email', 'eq', data.industryEmail)
      .single();

    if (indError || !industry) return [];

    const { data: reports, error } = await supabaseAdmin
      .from('monthly_reports')
      .select('*')
      .filter('industry_id', 'eq', industry.id)
      .filter('status', 'eq', 'publicado')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) throw error;
    return reports;
  });
