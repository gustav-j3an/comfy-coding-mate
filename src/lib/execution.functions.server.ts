import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Starts a scheduled visit based on a route stop.
 * Reuses existing visit if already created for that day/promoter/stop.
 */
export const startScheduledVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    routeStopId: z.string(),
    date: z.string(), // ISO date string (YYYY-MM-DD)
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!userId) throw new Error("Não autorizado");

    // 1. Resolve promoter_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('promoter_id')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile?.promoter_id) {
      throw new Error("Usuário não vinculado a um promotor.");
    }

    const promoterId = profile.promoter_id;
    const { routeStopId, date: scheduledDate } = data;

    // Validate that the date is today
    const todayStr = new Date().toISOString().split('T')[0];
    if (scheduledDate !== todayStr) {
      throw new Error("Você só pode iniciar visitas na data programada (hoje).");
    }

    // 2. Resolve Route Stop details
    const { data: stop, error: stopError } = await supabaseAdmin
      .from('route_stops')
      .select(`
        *,
        route:routes(*)
      `)
      .eq('id', routeStopId)
      .single();

    if (stopError || !stop) {
      throw new Error("Parada de roteiro não encontrada.");
    }

    // Validate ownership and status
    const route = (stop as any).route;
    if (route.promoter_id !== promoterId) {
      throw new Error("Esta parada não pertence ao seu roteiro.");
    }
    if (!route.active || route.status !== 'published') {
      throw new Error("O roteiro de origem não está ativo ou publicado.");
    }

    // 3. Find existing visit for this stop/date/promoter
    const { data: existingVisit } = await supabaseAdmin
      .from('visits')
      .select('id')
      .eq('promoter_id', promoterId)
      .eq('store_id', (stop as any).store_id)
      .eq('scheduled_date', scheduledDate)
      .limit(1)
      .maybeSingle();

    if (existingVisit) {
      return { visitId: existingVisit.id };
    }

    // 4. Materialize new visit
    // We get tasks to know if there's a primary industry or just use the first one if multiple
    const { data: tasks } = await supabaseAdmin
      .from('stop_tasks')
      .select('industry_id')
      .eq('stop_id', routeStopId);
    
    const industryId = (tasks && tasks.length > 0) ? tasks[0].industry_id : "";

    const { data: newVisit, error: insertError } = await supabaseAdmin
      .from('visits')
      .insert({
        promoter_id: promoterId,
        store_id: (stop as any).store_id,
        industry_id: industryId, 
        scheduled_date: scheduledDate,
        status: 'pending',
        route_id: (stop as any).route_id,
        observation: (stop as any).observation
      } as any)
      .select('id')
      .single();

    if (insertError) {
      console.error('Error materializing visit:', insertError);
      throw new Error("Não foi possível iniciar a visita no servidor.");
    }

    return { visitId: newVisit.id };
  });

/**
 * Gets the promoter's agenda for a specific date, merging planned route stops and materialized visits.
 */
export const getPromoterAgenda = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    date: z.string(), // ISO date string (YYYY-MM-DD)
    promoterId: z.string().optional() // Optional, used for admin preview
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!userId) throw new Error("Não autorizado");

    // Get user email for logging
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
    const maskedEmail = authUser?.email ? authUser.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "unknown";

    // 1. Resolve effective promoter ID
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    let effectivePromoterId: string | undefined = data.promoterId;
    
    if (!effectivePromoterId || userRole?.role !== 'admin') {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('promoter_id')
        .eq('id', userId)
        .single();
      
      effectivePromoterId = profile?.promoter_id || undefined;
    }

    const scheduledDateStr = data.date;

    if (!effectivePromoterId) {
      console.log(`[Agenda] User: ${maskedEmail}, PromoterID: NONE, Date: ${scheduledDateStr}, Count: 0`);
      return [];
    }
    const dateObj = new Date(scheduledDateStr + 'T12:00:00Z'); // Midday UTC
    const dayOfWeek = dateObj.getDay(); // 0=Sunday, 1=Monday...

    // 2. Fetch materialized visits
    const { data: materializedVisits, error: matError } = await supabaseAdmin
      .from('visits')
      .select(`
        *,
        store:stores(name, address),
        industry:industries(name)
      `)
      .eq('promoter_id', effectivePromoterId)
      .eq('scheduled_date', scheduledDateStr)
      .order('created_at', { ascending: true });

    if (matError) throw matError;

    // 3. Fetch active routes to find theoretical stops
    const { data: activeRoutes, error: routesError } = await supabaseAdmin
      .from('routes')
      .select(`
        id,
        name,
        valid_from,
        route_stops (
          id,
          store_id,
          day_of_week,
          visit_order,
          frequency,
          biweekly_start_date,
          observation,
          store:stores(name, address),
          stop_tasks (
            industry_id,
            industry:industries(name)
          )
        )
      `)
      .eq('promoter_id', effectivePromoterId)
      .eq('active', true)
      .eq('status', 'published');

    if (routesError) throw routesError;

    const theoreticalVisits: any[] = [];
    if (activeRoutes) {
      for (const route of activeRoutes) {
        const stopsForDay = (route.route_stops || []).filter((s: any) => {
          const stopDay = Number(s.day_of_week);
          return stopDay === dayOfWeek;
        });
        
        for (const stop of stopsForDay) {
          // Frequency check
          let shouldShow = true;
          if (stop.frequency === 'biweekly') {
            const start = stop.biweekly_start_date ? new Date(stop.biweekly_start_date) : (route.valid_from ? new Date(route.valid_from) : new Date());
            const diffWeeks = Math.floor(Math.abs(dateObj.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
            shouldShow = diffWeeks % 2 === 0;
          }

          if (shouldShow) {
            for (const task of (stop.stop_tasks || [])) {
              // Only add if not already materialized
              const isAlreadyMaterialized = (materializedVisits || []).some(mv => 
                mv.store_id === stop.store_id && mv.industry_id === task.industry_id
              );
              
              if (!isAlreadyMaterialized) {
                theoreticalVisits.push({
                  id: `theoretical-${stop.id}-${task.industry_id}`,
                  route_stop_id: stop.id, // For materialization
                  store_id: stop.store_id,
                  industry_id: task.industry_id,
                  status: 'planned',
                  scheduled_date: scheduledDateStr,
                  visit_order: stop.visit_order,
                  store: stop.store,
                  industry: task.industry,
                  observation: stop.observation,
                  frequency: stop.frequency,
                  is_theoretical: true,
                  route_id: route.id,
                  route_name: route.name
                });
              }
            }
          }
        }
      }
    }

    // Merge and sort
    const merged = [...(materializedVisits || []), ...theoreticalVisits].sort((a, b) => 
      (a.visit_order || 0) - (b.visit_order || 0)
    );

    console.log(`[Agenda] User: ${maskedEmail}, PromoterID: ${effectivePromoterId}, Date: ${scheduledDateStr}, Count: ${merged.length}`);
    return merged;
  });
