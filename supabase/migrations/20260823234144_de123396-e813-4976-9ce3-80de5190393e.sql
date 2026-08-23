-- Adicionar route_id e industry_id para melhor rastreabilidade em visits
-- Nota: industry_id já deve existir mas garantimos que as relações estão OK
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'route_id') THEN
        ALTER TABLE public.visits ADD COLUMN route_id uuid REFERENCES public.routes(id);
    END IF;
END $$;

-- Garantir que as evidências e ocorrências tenham o vínculo com a indústria (opcional no schema, mas útil na execução)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visit_evidence' AND column_name = 'industry_id') THEN
        ALTER TABLE public.visit_evidence ADD COLUMN industry_id uuid REFERENCES public.industries(id);
    END IF;
END $$;

-- RLS e Grants
GRANT SELECT, INSERT, UPDATE ON public.visits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.visit_evidence TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.occurrences TO authenticated;
