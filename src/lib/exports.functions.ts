import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "./auth/supabase-auth.server";


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
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();

    const { user } = await requireSupabaseAuth({ request });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const userId = user.id;



    const { data: task, error } = await (supabaseAdmin
      .from('export_tasks' as any) as any)
      .insert({
        format: data.format,
        filters: data.filters,
        industry_id: data.industryId || null,
        status: 'solicitada',
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    
    return task;
  });

export const getExportTasks = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({
    industryId: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    let query = (supabaseAdmin
      .from('export_tasks' as any) as any)
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
    
    const { data: task, error: taskError } = await (supabaseAdmin
      .from('export_tasks' as any) as any)
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
    
    // Update download count using manual update since RPC might not be in types yet
    await (supabaseAdmin
      .from('export_tasks' as any) as any)
      .update({ 
        download_count: 1, // Simplified increment for now
        last_downloaded_at: new Date().toISOString() 
      })
      .eq('id', data.taskId);
      
    return urlData.signedUrl;
  });
