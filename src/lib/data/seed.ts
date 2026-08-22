import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, addDays } from 'date-fns';

export async function seedTestData() {
  try {
    // 1. Create industry
    const { data: industry, error: indError } = await (supabase as any)
      .from('industries')
      .insert({ name: 'Indústria King', active: true })
      .select()
      .single();
    if (indError) throw indError;

    // 2. Create store
    const { data: store, error: storeError } = await (supabase as any)
      .from('stores')
      .insert({ 
        name: 'Atacadão QNL', 
        address: 'St. L Norte QNL 1 - Taguatinga, Brasília - DF',
        latitude: -15.8167,
        longitude: -48.0833
      })
      .select()
      .single();
    if (storeError) throw storeError;

    // 3. Create promoter (assuming current user is the promoter for test)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Ensure role is promoter
    await (supabase as any).from('user_roles').upsert({
      user_id: user.id,
      role: 'promoter'
    });

    // 4. Create route
    const { data: route, error: routeError } = await (supabase as any)
      .from('routes')
      .insert({
        promoter_id: user.id,
        name: 'Rota Brasília Norte',
        active: true,
        valid_from: format(new Date(), 'yyyy-MM-dd')
      })
      .select()
      .single();
    if (routeError) throw routeError;

    // 5. Create stops for every weekday
    for (let i = 1; i <= 5; i++) {
      const { data: stop, error: stopError } = await (supabase as any)
        .from('route_stops')
        .insert({
          route_id: route.id,
          store_id: store.id,
          day_of_week: i,
          visit_order: 1,
          frequency: 'weekly'
        })
        .select()
        .single();
      
      if (stopError) throw stopError;

      // 6. Create task for stop
      await (supabase as any).from('stop_tasks').insert({
        stop_id: stop.id,
        industry_id: industry.id
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error seeding test data:', error);
    return { success: false, error };
  }
}
