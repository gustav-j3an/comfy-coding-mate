import { z } from "zod";

export const promoterSchema = z.object({
  name: z.string().min(3, "Nome é obrigatório"),
  phone: z.string().min(8, "Telefone inválido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  region: z.string().optional(),
  active: z.boolean().default(true),
});

export const storeSchema = z.object({
  name: z.string().min(3, "Nome é obrigatório"),
  address: z.string().min(5, "Endereço é obrigatório"),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  active: z.boolean().default(true),
});

export const industrySchema = z.object({
  name: z.string().min(3, "Nome é obrigatório"),
  cnpj: z.string().optional(),
  contact_name: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  active: z.boolean().default(true),
});

export const contractSchema = z.object({
  industry_id: z.string().uuid("Indústria é obrigatória"),
  contract_number: z.string().min(1, "Número do contrato é obrigatório"),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  end_date: z.string().optional().nullable(),
  status: z.enum(["draft", "active", "terminated"]),
  value_per_visit: z.number().min(0, "Valor deve ser maior ou igual a zero"),
  min_monthly_visits: z.number().int().min(0).optional().nullable(),
  billing_day: z.number().int().min(1).max(31, "Dia inválido"),
  billing_details: z.string().optional(),
  commercial_responsible: z.string().optional(),
  notes: z.string().optional(),
});

export const billingSchema = z.object({
  industry_id: z.string().uuid("Indústria é obrigatória"),
  competence_month: z.number().int().min(1).max(12),
  competence_year: z.number().int().min(2000),
  due_date: z.string().min(1, "Vencimento é obrigatório"),
  discount: z.number().min(0).default(0),
  increase: z.number().min(0).default(0),
  notes: z.string().optional(),
  adjustment_reason: z.string().optional(),
});

