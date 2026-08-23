import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { format, addDays, startOfWeek } from "date-fns";

/**
 * Publishes a route and generates visits for the next 90 days.
 */
export const publishRoute = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    routeId: z.string(),
    summary: z.string().optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { routeId, summary } = data;
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!userId) throw new Error("Não autorizado");

    // AUTH REINFORCEMENT
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (userRole?.role !== 'admin') {
      throw new Error("Não autorizado: Apenas administradores podem gerenciar rotas.");
    }

    // 1. Fetch route with stops and tasks
    const { data: route, error: routeError } = await supabaseAdmin
      .from('routes')
      .select(`
        *,
        route_stops (
          *,
          stop_tasks (*)
        )
      `)
      .eq('id', routeId)
      .single();

    if (routeError || !route) throw new Error("Rota não encontrada");

    const stops = (route as any).route_stops || [];

    // 2. Validate at least one stop exists
    if (stops.length === 0) {
      throw new Error("A rota deve ter pelo menos uma parada");
    }

    // 3. Update route status and version
    const newVersion = (route.version || 0) + 1;
    const { error: updateError } = await supabaseAdmin
      .from('routes')
      .update({ 
        status: 'published' as any, 
        version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', routeId);

    if (updateError) throw updateError;

    // 4. Create version record
    await supabaseAdmin.from('route_versions' as any).insert({
      route_id: routeId,
      version: newVersion,
      changes_summary: summary || `Versão ${newVersion} publicada`
    });

    // 5. Cancel future unexecuted visits from old version
    const today = format(new Date(), 'yyyy-MM-dd');
    await supabaseAdmin
      .from('visits')
      .delete()
      .eq('promoter_id', route.promoter_id)
      .gt('scheduled_date', today)
      .eq('status', 'planned' as any);

    // 6. Generate new visits for 90 days
    const startDate = route.valid_from ? new Date(route.valid_from) : new Date();
    const endDate = addDays(startDate, 90);
    const visitsToInsert = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // 0=Sunday, 1=Monday...
      
      const stopsForDay = stops.filter((s: any) => s.day_of_week === dayOfWeek);

      for (const stop of stopsForDay) {
        let shouldGenerate = true;
        if (stop.frequency === 'biweekly') {
          const refDate = stop.biweekly_start_date ? new Date(stop.biweekly_start_date) : startDate;
          const weeksDiff = Math.floor((d.getTime() - startOfWeek(refDate).getTime()) / (7 * 24 * 60 * 60 * 1000));
          shouldGenerate = weeksDiff % 2 === 0;
        }

        if (shouldGenerate) {
          for (const task of stop.stop_tasks) {
            visitsToInsert.push({
              promoter_id: route.promoter_id,
              store_id: stop.store_id,
              industry_id: task.industry_id,
              scheduled_date: format(d, 'yyyy-MM-dd'),
              status: 'planned' as any
            });
          }
        }
      }
    }

    if (visitsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('visits')
        .insert(visitsToInsert as any);
      
      if (insertError) throw insertError;
    }

    return { success: true, visitsGenerated: visitsToInsert.length };
  });

/**
 * Creates an extraordinary route override.
 */
export const createExtraordinaryRoute = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    promoterId: z.string(),
    date: z.string(),
    name: z.string(),
    stops: z.array(z.object({
      storeId: z.string(),
      order: z.number(),
      industryIds: z.array(z.string()),
      observation: z.string().optional()
    }))
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Create extraordinary route
    const { data: er, error: erError } = await supabaseAdmin
      .from('extraordinary_routes' as any)
      .insert({
        promoter_id: data.promoterId,
        date: data.date,
        name: data.name
      })
      .select('id')
      .single();

    if (erError || !er) throw new Error("Erro ao criar rota extraordinária");

    // 2. Create stops and tasks
    for (const stopData of data.stops) {
      const { data: stop, error: stopError } = await supabaseAdmin
        .from('extraordinary_route_stops' as any)
        .insert({
          extraordinary_route_id: (er as any).id,
          store_id: stopData.storeId,
          visit_order: stopData.order,
          observation: stopData.observation
        })
        .select('id')
        .single();
      
      if (stopError || !stop) throw new Error("Erro ao criar parada extraordinária");

      const tasks = stopData.industryIds.map(iid => ({
        extraordinary_stop_id: (stop as any).id,
        industry_id: iid
      }));

      await supabaseAdmin.from('extraordinary_stop_tasks' as any).insert(tasks);

      // 3. Generate immediate visits for this extraordinary route
      const visits = stopData.industryIds.map(iid => ({
        promoter_id: data.promoterId,
        store_id: stopData.storeId,
        industry_id: iid,
        scheduled_date: data.date,
        status: 'planned' as any
      }));

      // Cancel existing planned visits for this promoter/date first
      await supabaseAdmin
        .from('visits')
        .delete()
        .eq('promoter_id', data.promoterId)
        .eq('scheduled_date', data.date)
        .eq('status', 'planned' as any);

      await supabaseAdmin.from('visits').insert(visits as any);
    }

    return { success: true };
  });

/**
 * Archive a route
 */
export const archiveRoute = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    routeId: z.string()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { routeId } = data;
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!userId) throw new Error("Não autorizado: Sessão não encontrada.");

    // AUTH REINFORCEMENT: Use security definer function if possible, or direct check
    const { data: hasRole } = await supabaseAdmin.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });

    if (!hasRole) {
      throw new Error("Não autorizado: Apenas administradores podem gerenciar rotas.");
    }

    const { error } = await supabaseAdmin
      .from('routes')
      .update({ 
        status: 'archived' as any,
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', routeId);

    if (error) throw error;
    return { success: true };
  });

/**
 * Pause or resume a route
 */
export const toggleRouteActive = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    routeId: z.string(),
    active: z.boolean()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { routeId, active } = data;
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!userId) throw new Error("Não autorizado: Sessão não encontrada.");

    const { data: hasRole } = await supabaseAdmin.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });

    if (!hasRole) {
      throw new Error("Não autorizado: Apenas administradores podem gerenciar rotas.");
    }

    const { error } = await supabaseAdmin
      .from('routes')
      .update({ 
        active,
        updated_at: new Date().toISOString()
      })
      .eq('id', routeId);

    if (error) throw error;
    return { success: true };
  });

/**
 * Delete a route (only if safe)
 */
export const deleteRouteSafely = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    routeId: z.string()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { routeId } = data;
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!userId) throw new Error("Não autorizado: Sessão não encontrada.");

    const { data: hasRole } = await supabaseAdmin.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });

    if (!hasRole) {
      throw new Error("Não autorizado: Apenas administradores podem gerenciar rotas.");
    }

    // 1. Check if route has executed visits
    const { data: executedVisits, error: visitError } = await supabaseAdmin
      .from('visits')
      .select('id')
      .eq('route_id' as any, routeId)
      .neq('status', 'planned' as any)
      .limit(1);

    if (visitError) throw visitError;

    if (executedVisits && executedVisits.length > 0) {
      throw new Error("Esta rota possui histórico de visitas executadas e não pode ser excluída. Tente arquivá-la.");
    }

    // 2. Delete route (cascading will handle stops and stop_tasks)
    const { error } = await supabaseAdmin
      .from('routes')
      .delete()
      .eq('id', routeId);

    if (error) throw error;
    return { success: true };
  });

/**
 * Duplicates a route
 */
export const duplicateRoute = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    routeId: z.string()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { routeId } = data;
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!userId) throw new Error("Não autorizado: Sessão não encontrada.");

    const { data: hasRole } = await supabaseAdmin.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });

    if (!hasRole) {
      throw new Error("Não autorizado: Apenas administradores podem gerenciar rotas.");
    }

    // 1. Fetch source route
    const { data: route, error: routeError } = await supabaseAdmin
      .from('routes')
      .select(`
        *,
        route_stops (
          *,
          stop_tasks (*)
        )
      `)
      .eq('id', routeId)
      .single();

    if (routeError || !route) throw new Error("Rota original não encontrada.");

    // 2. Create new route
    const { data: newRoute, error: newRouteError } = await supabaseAdmin
      .from('routes')
      .insert({
        name: `${route.name} (Cópia)`,
        promoter_id: route.promoter_id,
        valid_from: route.valid_from,
        active: false,
        status: 'draft' as any,
        version: 1,
        created_by: userId
      })
      .select()
      .single();

    if (newRouteError || !newRoute) throw newRouteError;

    // 3. Duplicate stops and tasks
    const stops = (route as any).route_stops || [];
    for (const stop of stops) {
      const { data: newStop, error: stopError } = await supabaseAdmin
        .from('route_stops')
        .insert({
          route_id: newRoute.id,
          store_id: stop.store_id,
          day_of_week: stop.day_of_week,
          visit_order: stop.visit_order,
          frequency: stop.frequency,
          biweekly_start_date: stop.biweekly_start_date,
          observation: stop.observation,
        })
        .select()
        .single();
      
      if (stopError || !newStop) {
        // Cleanup if possible or just throw
        throw stopError || new Error("Erro ao duplicar parada.");
      }

      if (stop.stop_tasks && stop.stop_tasks.length > 0) {
        const tasks = stop.stop_tasks.map((task: any) => ({
          stop_id: newStop.id,
          industry_id: task.industry_id
        }));
        await supabaseAdmin.from('stop_tasks').insert(tasks);
      }
    }

    return { success: true, newRouteId: newRoute.id };
  });

