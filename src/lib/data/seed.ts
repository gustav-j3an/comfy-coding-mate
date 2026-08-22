import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export async function seedTestData() {
  try {
    // 1. Create industry
    const { data: industry, error: indError } = await (supabase as any)
      .from('industries')
      .insert({ 
        name: 'Indústria King (Teste)', 
        active: true,
        cnpj: '12.345.678/0001-90',
        contact_name: 'Marcos Silva',
        email: 'contato@king.com.br',
        phone: '(61) 98888-7777'
      })
      .select()
      .single();
    if (indError) throw indError;

    // 2. Create store
    const { data: store, error: storeError } = await (supabase as any)
      .from('stores')
      .insert({ 
        name: 'Atacadão QNL (Teste)', 
        address: 'St. L Norte QNL 1 - Taguatinga, Brasília - DF',
        city: 'Brasília',
        state: 'DF',
        cep: '72150-000',
        latitude: -15.8167,
        longitude: -48.0833,
        active: true
      })
      .select()
      .single();
    if (storeError) throw storeError;

    // 3. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 4. Create promoter record (independent of auth user for management)
    const { data: promoterRecord, error: promError } = await (supabase as any)
      .from('promoters')
      .insert({
        name: 'João Silva (Teste)',
        phone: '(61) 99999-8888',
        email: user.email,
        region: 'Taguatinga / Ceilândia',
        active: true
      })
      .select()
      .single();
    if (promError) throw promError;

    // 5. Update profile to link to this promoter record
    await (supabase as any)
      .from('profiles')
      .update({ promoter_id: promoterRecord.id })
      .eq('id', user.id);

    // 6. Create route
    const { data: route, error: routeError } = await (supabase as any)
      .from('routes')
      .insert({
        promoter_id: promoterRecord.id, // Linked to promoters.id
        name: 'Rota Brasília Norte (Teste)',
        active: true,
        valid_from: format(new Date(), 'yyyy-MM-dd')
      })
      .select()
      .single();
    if (routeError) throw routeError;

    // 7. Create stops for every weekday
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

      // 8. Create task for stop
      await (supabase as any).from('stop_tasks').insert({
        stop_id: stop.id,
        industry_id: industry.id
      });
    }

    // 9. Create a test visit already submitted to test the conference screen
    const { error: visitError } = await (supabase as any)
      .from('visits')
      .insert({
        promoter_id: promoterRecord.id,
        store_id: store.id,
        industry_id: industry.id,
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'submitted',
        observation: 'Abastecimento realizado conforme planograma.'
      });
    
    if (visitError) throw visitError;

    return { success: true };
  } catch (error) {
    console.error('Error seeding test data:', error);
    return { success: false, error };
  }
}
