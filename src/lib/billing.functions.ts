import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getContracts = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from('contracts')
      .select('*, industry:industries(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  });

export const createContract = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    industry_id: z.string(),
    contract_number: z.string(),
    start_date: z.string(),
    end_date: z.string().optional().nullable(),
    status: z.enum(["draft", "active", "terminated"]),
    value_per_visit: z.number(),
    min_monthly_visits: z.number().optional().nullable(),
    billing_day: z.number(),
    billing_details: z.string().optional().nullable(),
    commercial_responsible: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Explicitly handle undefined -> null for Supabase
    const insertData = {
      ...data,
      end_date: data.end_date ?? null,
      min_monthly_visits: data.min_monthly_visits ?? null,
      billing_details: data.billing_details ?? null,
      commercial_responsible: data.commercial_responsible ?? null,
      notes: data.notes ?? null,
    };

    const { data: contract, error } = await supabaseAdmin
      .from('contracts')
      .insert([insertData as any])
      .select()
      .single();

    if (error) throw error;
    return contract;
  });

export const updateContract = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    id: z.string(),
    updates: z.record(z.any()),
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: contract, error } = await supabaseAdmin
      .from('contracts')
      .update(data.updates as any)
      .filter('id', 'eq', data.id)
      .select()
      .single();

    if (error) throw error;
    return contract;
  });

export const getBillings = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from('billings')
      .select('*, industry:industries(name), contract:contracts(contract_number)')
      .order('competence_year', { ascending: false })
      .order('competence_month', { ascending: false });

    if (error) throw error;
    return data;
  });

export const calculateBillingPreview = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    industry_id: z.string(),
    month: z.number(),
    year: z.number(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // 1. Get active contract
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .select('*')
      .filter('industry_id', 'eq', data.industry_id)
      .filter('status', 'eq', 'active')
      .single();

    if (contractError || !contract) {
      throw new Error("Nenhum contrato ativo encontrado para esta indústria.");
    }

    const startDate = new Date(data.year, data.month - 1, 1).toISOString();
    const endDate = new Date(data.year, data.month, 0, 23, 59, 59).toISOString();

    // 2. Count approved visits
    const { data: visits, error: visitsError } = await supabaseAdmin
      .from('visits')
      .select('id, store_id, stores(name), promoter_id, promoters(name), scheduled_date, approved_at')
      .filter('industry_id', 'eq', data.industry_id)
      .filter('status', 'eq', 'approved')
      .filter('scheduled_date', 'gte', startDate)
      .filter('scheduled_date', 'lte', endDate);

    if (visitsError) throw visitsError;

    const approvedCount = visits?.length || 0;
    const unitValue = contract.value_per_visit;
    const subtotal = approvedCount * unitValue;

    return {
      contract,
      approvedCount,
      unitValue,
      subtotal,
      visits: (visits as any[]) || [],
    };
  });

export const createBilling = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    industry_id: z.string(),
    contract_id: z.string(),
    competence_month: z.number(),
    competence_year: z.number(),
    approved_visits_count: z.number(),
    unit_value: z.number(),
    subtotal: z.number(),
    discount: z.number(),
    increase: z.number(),
    total_value: z.number(),
    due_date: z.string(),
    notes: z.string().optional().nullable(),
    adjustment_reason: z.string().optional().nullable(),
    visits: z.array(z.any()), // For snapshot
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Generate unique billing number
    const billingNumber = `BILL-${data.competence_year}${data.competence_month.toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const { visits, ...billingData } = data;

    // 1. Create billing record
    const insertData = {
      ...billingData,
      billing_number: billingNumber,
      status: 'draft',
      notes: billingData.notes ?? null,
      adjustment_reason: billingData.adjustment_reason ?? null,
    };

    const { data: billing, error: billingError } = await supabaseAdmin
      .from('billings')
      .insert([insertData as any])
      .select()
      .single();

    if (billingError) throw billingError;

    // 2. Create snapshot items
    const snapshotItems = visits.map(v => ({
      billing_id: billing.id,
      visit_id: v.id,
      store_name: v.stores?.name || 'N/A',
      promoter_name: v.promoters?.name || 'N/A',
      visit_date: v.scheduled_date,
      approved_at: v.approved_at
    }));

    const { error: snapshotError } = await supabaseAdmin
      .from('billing_items')
      .insert(snapshotItems);

    if (snapshotError) throw snapshotError;

    return billing;
  });

export const updateBillingStatus = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    id: z.string(),
    status: z.enum(['draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled']),
    cancellation_reason: z.string().optional(),
    payment_link: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const updates: any = {
      status: data.status,
      updated_at: new Date().toISOString()
    };

    if (data.status === 'issued') {
      updates.issued_at = new Date().toISOString();
    }
    if (data.cancellation_reason) updates.cancellation_reason = data.cancellation_reason;
    if (data.payment_link) updates.payment_link = data.payment_link;

    const { data: billing, error } = await supabaseAdmin
      .from('billings')
      .update(updates)
      .filter('id', 'eq', data.id)
      .select()
      .single();

    if (error) throw error;
    return billing;
  });

export const getIndustryBillings = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({
    industryId: z.string()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: billings, error } = await supabaseAdmin
      .from('billings')
      .select('*, contract:contracts(contract_number)')
      .filter('industry_id', 'eq', data.industryId)
      .filter('status', 'neq', 'draft') // Only non-draft for industry portal
      .order('competence_year', { ascending: false })
      .order('competence_month', { ascending: false });

    if (error) throw error;
    return billings;
  });

export const getBillingItems = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({
    billingId: z.string()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: items, error } = await supabaseAdmin
      .from('billing_items')
      .select('*')
      .filter('billing_id', 'eq', data.billingId);

    if (error) throw error;
    return items;
  });
