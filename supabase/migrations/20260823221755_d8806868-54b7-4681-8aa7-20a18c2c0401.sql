-- 2. Drop existing weak policies
drop policy if exists "Promoters can upload their own evidence" on storage.objects;
drop policy if exists "Users can view authorized evidence" on storage.objects;

-- 3. Policy: Promoters can INSERT (upload) to their own visits
create policy "Promoters can upload evidence to their own visits"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'visit-evidences' AND
  (storage.foldername(name))[1] = 'evidences' AND
  exists (
    select 1 from public.visits v
    join public.promoters p on v.promoter_id = p.id
    where v.id::text = (storage.foldername(name))[2]
    and p.user_id = auth.uid()
  )
);

-- 4. Policy: SELECT (read)
create policy "Restricted evidence access"
on storage.objects for select to authenticated
using (
  bucket_id = 'visit-evidences' AND (
    -- Admins see everything
    public.has_role(auth.uid(), 'admin') OR
    -- Promoters see their own
    exists (
      select 1 from public.visits v
      join public.promoters p on v.promoter_id = p.id
      where v.id::text = (storage.foldername(name))[2]
      and p.user_id = auth.uid()
    ) OR
    -- Industry see their own visits
    exists (
      select 1 from public.visits v
      join public.profiles pr on pr.id = auth.uid()
      where v.id::text = (storage.foldername(name))[2]
      and v.industry_id = pr.industry_id
      and public.has_role(auth.uid(), 'industry')
    )
  )
);

-- 5. Policy: System/Admin DELETE (for retention)
create policy "Admins and system can delete evidence"
on storage.objects for delete to authenticated
using (
  bucket_id = 'visit-evidences' AND
  public.has_role(auth.uid(), 'admin')
);