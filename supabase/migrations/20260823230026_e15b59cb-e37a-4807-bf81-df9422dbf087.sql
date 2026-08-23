ALTER TABLE public.profiles ADD COLUMN must_change_password BOOLEAN DEFAULT false;

-- Grant access
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;