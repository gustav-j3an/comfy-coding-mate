import { z } from "zod";

export const promoterSchema = z.object({
  name: z.string().min(3, "Nome é obrigatório"),
  phone: z.string().min(8, "Telefone inválido"),
  email: z.string().email().optional().or(z.literal("")),
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
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  active: z.boolean().default(true),
});
