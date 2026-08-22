import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const exportFiltersSchema = z.object({
  industryId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  promoterId: z.string().optional(),
  status: z.string().optional(),
});

export const createExportTask = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    format: z.enum(["xlsx", "zip", "pdf"]),
    filters: exportFiltersSchema,
    industryId: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // In a real environment, we'd get this from context or requireSupabaseAuth
    // For now, using a placeholder until context propagation is fully wired
    const userId = '00000000-0000-0000-0000-000000000000';

    const { data: task, error } = await supabaseAdmin
      .from('export_tasks')
      .insert({
        format: data.format,
        filters: data.filters,
        industry_id: data.industryId || null,
        status: 'solicitada',
        user_id: userId
      } as any)
      .select()
      .single();

    if (error) throw error;
    
    // Trigger mock background processing
    // In a real app, this would be an async job
    return task;
  });

export const getExportTasks = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({
    industryId: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    let query = supabaseAdmin
      .from('export_tasks')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data.industryId) {
      query = query.eq('industry_id', data.industryId);
    }
    
    const { data: tasks, error } = await query;
    if (error) throw error;
    return tasks;
  });

export const getDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    taskId: z.string()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: task, error: taskError } = await supabaseAdmin
      .from('export_tasks')
      .select('file_path, status')
      .eq('id', data.taskId)
      .single();
      
    if (taskError || !task) {
      throw new Error('Tarefa não encontrada');
    }

    if (task.status !== 'pronta' || !task.file_path) {
      throw new Error('Arquivo ainda não está pronto ou expirou');
    }
    
    const { data: urlData, error: urlError } = await supabaseAdmin
      .storage
      .from('exports')
      .createSignedUrl(task.file_path, 60 * 60); // 1 hour
      
    if (urlError) throw urlError;
    
    // Update download count (incrementally)
    await supabaseAdmin.rpc('increment_export_download', { task_id: data.taskId });
      
    return urlData.signedUrl;
  });
