import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const startScheduledVisit = async ({ data, context }: any) => {
  const { userId } = context;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (!userId) throw new Error("Não autorizado: Sessão não encontrada.");

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('promoter_id')
    .eq('id', userId)
    .single();
  
  if (!profile?.promoter_id) {
    throw new Error("Não autorizado: Usuário não vinculado a um promotor.");
  }


  const promoterId = profile.promoter_id;
  const { routeStopId, date: scheduledDate, industryId } = data;

  const now = new Date();
  const saoPauloDate = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
  
  if (scheduledDate !== saoPauloDate) {
    console.error(`[StartVisit] Date mismatch: Scheduled=${scheduledDate}, SP_Now=${saoPauloDate}`);
    throw new Error(`Você só pode iniciar visitas na data programada. Hoje é ${saoPauloDate}, e a parada é para ${scheduledDate}.`);
  }

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

  const route = (stop as any).route;
  if (!route) {
    throw new Error("Roteiro não encontrado para esta parada.");
  }
  if (route.promoter_id !== promoterId) {
    throw new Error("Esta parada não pertence ao seu roteiro.");
  }
  if (!route.active || route.status !== 'published') {
    throw new Error("O roteiro de origem não está ativo ou publicado.");
  }

  const { data: existingVisit } = await supabaseAdmin
    .from('visits')
    .select('id')
    .eq('promoter_id', promoterId)
    .eq('store_id', (stop as any).store_id)
    .eq('scheduled_date', scheduledDate)
    .limit(1)
    .maybeSingle();

  if (existingVisit) {
    return { visitId: existingVisit.id, action: 'reused' as const };
  }

  const { data: tasks } = await supabaseAdmin
    .from('stop_tasks')
    .select('industry_id')
    .eq('stop_id', routeStopId);
  
  if (!industryId || !(tasks || []).some((task: any) => task.industry_id === industryId)) {
    throw new Error("Indústria não pertence a esta visita.");
  }

  const { data: newVisit, error: insertError } = await supabaseAdmin
    .from('visits')
    .insert({
      promoter_id: promoterId,
      store_id: (stop as any).store_id,
      industry_id: industryId, 
      scheduled_date: scheduledDate,
      status: 'pending',
      route_id: (stop as any).route_id,
      route_stop_id: routeStopId,
      observation: (stop as any).observation
    } as any)
    .select('id')
    .single();

  if (insertError) {
    console.error('Error materializing visit:', insertError);
    throw new Error("Não foi possível iniciar a visita no servidor.");
  }

  return { visitId: newVisit.id, action: 'created' as const };
};

export const getPromoterAgenda = async ({ data, context }: any) => {
  const { userId } = context;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (!userId) throw new Error("Não autorizado: Sessão não encontrada no servidor.");

  const { data: userRole } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  let effectivePromoterId: string | undefined = data.promoterId;
  
  if (userRole?.role === 'admin' && effectivePromoterId) {
    // Admin can view any promoter's agenda
  } else if (userRole?.role === 'promoter' || !userRole) {
    // Promoter or user without explicit role (check profile)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('promoter_id')
      .eq('id', userId)
      .single();
    
    if (!profile?.promoter_id) {
      throw new Error("Não autorizado: Sua conta não está vinculada a um promotor.");
    }
    
    // SECURITY: A promoter can ONLY view their own agenda
    effectivePromoterId = profile.promoter_id;
  } else {
    throw new Error(`Não autorizado: Papel '${userRole?.role}' não tem acesso a esta agenda.`);
  }



  const scheduledDateStr = data.date;

  if (!effectivePromoterId) return [];

  const dateObj = new Date(scheduledDateStr + 'T12:00:00Z');
  const dayOfWeek = dateObj.getDay();

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
        let shouldShow = true;
        if (stop.frequency === 'biweekly') {
          const start = stop.biweekly_start_date ? new Date(stop.biweekly_start_date) : (route.valid_from ? new Date(route.valid_from) : new Date());
          const diffWeeks = Math.floor(Math.abs(dateObj.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
          shouldShow = diffWeeks % 2 === 0;
        }

        if (shouldShow) {
          for (const task of (stop.stop_tasks || [])) {
            const isAlreadyMaterialized = (materializedVisits || []).some(mv => 
              mv.store_id === stop.store_id && mv.industry_id === task.industry_id
            );
            
            if (!isAlreadyMaterialized) {
              theoreticalVisits.push({
                id: `theoretical-${stop.id}-${task.industry_id}`,
                route_stop_id: stop.id,
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

  return [...(materializedVisits || []), ...theoreticalVisits].sort((a, b) => 
    (Number(a.visit_order) || 0) - (Number(b.visit_order) || 0)
  );
};

export const getPromoterVisitExecution = async ({ data, context }: any) => {
  const { userId } = context;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (!userId) throw new Error("Não autorizado: Sessão não encontrada.");

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('promoter_id')
    .eq('id', userId)
    .single();
  
  if (!profile?.promoter_id) {
    throw new Error("Não autorizado: Usuário não vinculado a um promotor.");
  }


  const { data: visit, error: visitError } = await supabaseAdmin
    .from('visits')
    .select(`
      *,
      store:stores(*),
      industry:industries(*),
      route_stop:route_stops(
        *,
        stop_tasks(
          industry:industries(*)
        )
      )
    `)
    .eq('id', data.visitId)
    .single();

  if (visitError || !visit) {
    throw new Error("Visita não encontrada");
  }

  if (visit.promoter_id !== profile.promoter_id) {
    throw new Error("Acesso negado a esta visita");
  }

  const routeStop = (visit as any).route_stop;
  const tasks = routeStop?.stop_tasks || [];
  const industries = tasks.map((t: any) => t.industry).filter(Boolean);

  if (industries.length === 0 && visit.industry) {
    industries.push(visit.industry);
  }

  if (!data.industryId) {
    throw new Error("Selecione uma indústria para iniciar.");
  }
  if (!industries.some((industry: any) => industry.id === data.industryId)) {
    throw new Error("Indústria não pertence a esta visita.");
  }

  const { data: evidences, error: evidenceError } = await supabaseAdmin
    .from('visit_evidence')
    .select('id, file_path, file_type, evidence_type, industry_id')
    .eq('visit_id', data.visitId)
    .eq('industry_id', data.industryId);

  if (evidenceError) throw new Error("Não foi possível carregar as evidências da visita.");

  const normalizedEvidences = await Promise.all((evidences || []).map(async (e: any) => {
    const { data: signed, error } = await supabaseAdmin
      .storage
      .from('visit-evidences')
      .createSignedUrl(e.file_path, 3600);
    return {
      id: e.id,
      filePath: e.file_path,
      fileType: e.file_type,
      evidenceType: e.evidence_type,
      industryId: e.industry_id,
      signedUrl: error ? null : signed?.signedUrl || null,
    };
  }));

  return {
    visit: {
      id: visit.id,
      status: visit.status,
      scheduled_date: visit.scheduled_date,
      observation: visit.observation,
      checkin_at: visit.checkin_at,
      checkout_at: visit.checkout_at,
      industry_id: visit.industry_id
    },
    store: visit.store,
    industries: industries,
    evidences: normalizedEvidences,
    occurrences: []
  };
};

export const getPromoterVisitIndustries = async ({ data, context }: any) => {
  const { userId } = context;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!userId) throw new Error("Não autorizado.");
  const { data: profile } = await supabaseAdmin.from('profiles').select('promoter_id').eq('id', userId).single();
  const { data: visit } = await supabaseAdmin.from('visits').select('promoter_id, route_stop:route_stops(stop_tasks(industry:industries(*)))').eq('id', data.visitId).single();
  if (!profile?.promoter_id || !visit || visit.promoter_id !== profile.promoter_id) throw new Error("Acesso negado a esta visita.");
  return { industries: ((visit as any).route_stop?.stop_tasks || []).map((task: any) => task.industry).filter(Boolean) };
};

export const requestEvidenceUpload = async ({ data, context }: any) => {
  const { userId } = context;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (!userId) throw new Error("Não autorizado: Sessão não encontrada.");

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('promoter_id')
    .eq('id', userId)
    .single();
  
  if (!profile?.promoter_id) {
    throw new Error("Não autorizado: Usuário não vinculado a um promotor.");
  }

  const { data: visit, error: visitError } = await supabaseAdmin
    .from('visits')
    .select('id, promoter_id')
    .eq('id', data.visitId)
    .single();

  if (visitError || !visit) throw new Error("Visita não encontrada.");
  if (visit.promoter_id !== profile.promoter_id) throw new Error("Não autorizado: Esta visita não pertence a você.");

  // Validation
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(data.fileType)) {
    throw new Error("Formato de arquivo não permitido. Use JPG, PNG ou WEBP.");
  }

  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (data.fileSize > maxBytes) {
    throw new Error("Arquivo muito grande. Limite de 5MB.");
  }

  const allowedEvidenceTypes = ['replenishment', 'report', 'occurrence'];
  if (!allowedEvidenceTypes.includes(data.evidenceType)) {
    throw new Error("Tipo de evidência inválido.");
  }

  if (!data.industryId) throw new Error("Indústria não selecionada.");
  const { data: visitRoute } = await supabaseAdmin
    .from('visits')
    .select('route_stop_id')
    .eq('id', data.visitId)
    .single();
  if (!visitRoute?.route_stop_id) throw new Error("Parada da visita não encontrada.");
  const { data: task } = await supabaseAdmin
    .from('stop_tasks')
    .select('industry_id')
    .eq('stop_id', visitRoute.route_stop_id)
    .eq('industry_id', data.industryId)
    .maybeSingle();
  if (!task) throw new Error("Indústria não pertence à parada.");

  const fileExt = data.fileName.split('.').pop();
  const fileName = `${data.visitId}/${data.evidenceType}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `evidences/${fileName}`;

  const { data: uploadData, error: uploadError } = await supabaseAdmin
    .storage
    .from('visit-evidences')
    .createSignedUploadUrl(filePath);

  if (uploadError) {
    console.error("Signed URL Error:", uploadError);
    throw new Error("Erro ao gerar autorização de upload.");
  }

  return {
    uploadUrl: uploadData.signedUrl,
    token: uploadData.token,
    filePath,
  };
};

export const confirmEvidenceUpload = async ({ data, context }: any) => {
  const { userId } = context;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (!userId) throw new Error("Não autorizado.");

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('promoter_id')
    .eq('id', userId)
    .single();
  
  if (!profile?.promoter_id) throw new Error("Não autorizado.");

  const { data: visit } = await supabaseAdmin
    .from('visits')
    .select('id, promoter_id')
    .eq('id', data.visitId)
    .single();

  if (!visit || visit.promoter_id !== profile.promoter_id) throw new Error("Não autorizado.");

  if (!['replenishment', 'report', 'occurrence'].includes(data.evidenceType)) {
    throw new Error("Tipo de evidência inválido.");
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(data.fileType)) {
    throw new Error("Formato de arquivo não permitido.");
  }

  if (!data.industryId) throw new Error("Indústria não selecionada.");
  const { data: visitRoute } = await supabaseAdmin
    .from('visits')
    .select('route_stop_id')
    .eq('id', data.visitId)
    .single();
  if (!visitRoute?.route_stop_id) throw new Error("Parada da visita não encontrada.");
  const { data: task } = await supabaseAdmin
    .from('stop_tasks')
    .select('industry_id')
    .eq('stop_id', visitRoute.route_stop_id)
    .eq('industry_id', data.industryId)
    .maybeSingle();
  if (!task) throw new Error("Indústria não pertence a esta visita.");
  // Verify file existence in storage
  const pathParts = data.filePath.split('/');
  const fileName = pathParts.pop();
  const folder = pathParts.join('/'); 
  
  const { data: fileExists, error: storageError } = await supabaseAdmin
    .storage
    .from('visit-evidences')
    .list(folder, {
      limit: 1,
      search: fileName || ''
    });

  if (storageError || !fileExists || fileExists.length === 0) {
    throw new Error("Arquivo não encontrado no servidor.");
  }

  // Insert into visit_evidence
  const { data: evidence, error: insertError } = await supabaseAdmin
    .from('visit_evidence')
    .insert({
      visit_id: data.visitId,
      file_path: data.filePath,
      file_type: data.fileType,
      evidence_type: data.evidenceType,
      industry_id: data.industryId || null
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return evidence;
};
