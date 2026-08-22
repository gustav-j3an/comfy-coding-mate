-- visit_evidence: only admins and the executor can read
-- Grant access to authenticated users for the visit_evidence table
GRANT SELECT ON public.visit_evidence TO authenticated;
GRANT ALL ON public.visit_evidence TO service_role;

ALTER TABLE public.visit_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can see all evidence" ON public.visit_evidence;
CREATE POLICY "Admins can see all evidence" 
ON public.visit_evidence FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Executors can see their own evidence" ON public.visit_evidence;
CREATE POLICY "Executors can see their own evidence" 
ON public.visit_evidence FOR SELECT 
TO authenticated 
USING (auth.uid() = (SELECT executor_id FROM public.visits WHERE id = visit_id));

-- visit_audits: only admins can read
-- Grant access to authenticated users for the visit_audits table
GRANT SELECT ON public.visit_audits TO authenticated;
GRANT ALL ON public.visit_audits TO service_role;

ALTER TABLE public.visit_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can see all audits" ON public.visit_audits;
CREATE POLICY "Admins can see all audits" 
ON public.visit_audits FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Ensure occurrences have consistent industry_id from visit if missing
CREATE OR REPLACE FUNCTION public.sync_occurrence_industry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.industry_id IS NULL THEN
    SELECT industry_id INTO NEW.industry_id FROM public.visits WHERE id = NEW.visit_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_occurrence_industry ON public.occurrences;
CREATE TRIGGER tr_sync_occurrence_industry
BEFORE INSERT ON public.occurrences
FOR EACH ROW
EXECUTE FUNCTION public.sync_occurrence_industry();
