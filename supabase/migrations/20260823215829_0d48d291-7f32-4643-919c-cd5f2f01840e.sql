-- 1. Habilitar RLS nas tabelas faltantes
ALTER TABLE public.retention_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanup_audit ENABLE ROW LEVEL SECURITY;

-- Políticas para retention_alerts (Somente Admin vê e gerencia)
CREATE POLICY "Admins can manage retention alerts"
ON public.retention_alerts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para cleanup_audit (Somente Admin vê e gerencia)
CREATE POLICY "Admins can manage cleanup audit"
ON public.cleanup_audit
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Corrigir Search Path e Revogar Acessos Públicos a Funções
-- Revoga execução geral para anon e public
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM public, anon, authenticated;

-- Garante execução apenas para o que o frontend autenticado precisa chamar via RPC
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_last_admin(uuid) TO authenticated;

-- Garante acesso total para o service_role (usado pelas TanStack Server Functions)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Fixar search_path em funções SECURITY DEFINER para evitar ataques de shadowing
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.can_delete_promoter(uuid) SET search_path = public;
ALTER FUNCTION public.can_delete_store(uuid) SET search_path = public;
ALTER FUNCTION public.can_delete_industry(uuid) SET search_path = public;
ALTER FUNCTION public.get_admin_count() SET search_path = public;
ALTER FUNCTION public.is_last_admin(uuid) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.can_access_evidence(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.cleanup_expired_data() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_exports() SET search_path = public;
ALTER FUNCTION public.delete_user_safely(uuid) SET search_path = public;
ALTER FUNCTION public.increment_export_download(uuid) SET search_path = public;

-- Garantir search_path em funções SECURITY INVOKER também por boa prática
ALTER FUNCTION public.sync_occurrence_industry() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
