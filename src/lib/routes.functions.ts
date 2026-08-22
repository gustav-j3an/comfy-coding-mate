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
  .handler(async ({ data }) => {
    const { routeId, summary } = data;
    const { supabase } = await import("@/integrations/supabase/client.server");

    // 1. Fetch route with stops and tasks
    const { data: route, error: routeError } = await supabase
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
    const { error: updateError } = await supabase
      .from('routes')
      .update({ 
        status: 'published' as any, 
        version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', routeId);

    if (updateError) throw updateError;

    // 4. Create version record
    await supabase.from('route_versions' as any).insert({
      route_id: routeId,
      version: newVersion,
      changes_summary: summary || `Versão ${newVersion} publicada`
    });

    // 5. Cancel future unexecuted visits from old version
    const today = format(new Date(), 'yyyy-MM-dd');
    await supabase
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
      const { error: insertError } = await supabase
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
    const { supabase } = await import("@/integrations/supabase/client.server");

    // 1. Create extraordinary route
    const { data: er, error: erError } = await supabase
      .from('extraordinary_routes' as any)
      .insert({
        promoter_id: data.promoterId,
        date: data.date,
        name: data.name
      })
      .select()
      .single();

    if (erError) throw erError;

    // 2. Create stops and tasks
    for (const stopData of data.stops) {
      const { data: stop, error: stopError } = await supabase
        .from('extraordinary_route_stops' as any)
        .insert({
          extraordinary_route_id: er.id,
          store_id: stopData.storeId,
          visit_order: stopData.order,
          observation: stopData.observation
        })
        .select()
        .single();
      
      if (stopError) throw stopError;

      const tasks = stopData.industryIds.map(iid => ({
        extraordinary_stop_id: stop.id,
        industry_id: iid
      }));

      await supabase.from('extraordinary_stop_tasks' as any).insert(tasks);

      // 3. Generate immediate visits for this extraordinary route
      const visits = stopData.industryIds.map(iid => ({
        promoter_id: data.promoterId,
        store_id: stopData.storeId,
        industry_id: iid,
        scheduled_date: data.date,
        status: 'planned' as any
      }));

      // Cancel existing planned visits for this promoter/date first
      await supabase
        .from('visits')
        .delete()
        .eq('promoter_id', data.promoterId)
        .eq('scheduled_date', data.date)
        .eq('status', 'planned' as any);

      await supabase.from('visits').insert(visits as any);
    }

    return { success: true };
  });
