
/**
 * Gets the promoter's agenda for a specific date, merging planned route stops and materialized visits.
 */
export const getPromoterAgenda = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    date: z.string(), // ISO date string (YYYY-MM-DD)
    promoterId: z.string().optional() // Optional, used for admin preview
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!userId) throw new Error("Não autorizado");

    // 1. Resolve effective promoter ID
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    let effectivePromoterId = data.promoterId;
    
    if (!effectivePromoterId || userRole?.role !== 'admin') {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('promoter_id')
        .eq('id', userId)
        .single();
      
      if (!profile?.promoter_id) {
        return []; // Not a promoter
      }
      effectivePromoterId = profile.promoter_id;
    }

    const scheduledDateStr = data.date;
    const dateObj = new Date(scheduledDateStr + 'T12:00:00Z'); // Midday UTC to avoid timezone issues
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
      .order('visit_order', { ascending: true });

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
        const stopsForDay = (route.route_stops || []).filter((s: any) => Number(s.day_of_week) === dayOfWeek);
        
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
                  route_id: route.id
                });
              }
            }
          }
        }
      }
    }

    // Merge and sort
    return [...(materializedVisits || []), ...theoreticalVisits].sort((a, b) => 
      (a.visit_order || 0) - (b.visit_order || 0)
    );
  });
