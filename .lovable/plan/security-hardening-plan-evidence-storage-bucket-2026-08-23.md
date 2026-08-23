# Security Hardening Plan — Evidence Storage Bucket

Address critical security alerts for the `visit-evidences` storage bucket by implementing restrictive RLS policies and transitioning to temporary signed URLs.

## User Review Required

> [!IMPORTANT]
> - Ensure you have access to the Supabase Dashboard if manual policy removal is needed for "Promoters can upload their own evidence" and "Users can view authorized evidence" if they persist after SQL migration.

## Proposed Changes

### Storage Security (Supabase SQL)

1. **Bucket Privacy**: Explicitly set `visit-evidences` to private.
2. **Delete Weak Policies**: Drop existing broad policies for `visit-evidences`.
3. **Restricted Upload (INSERT)**:
   - Allow only `authenticated` users.
   - Verify user is a `promoter`.
   - Verify the file path matches `evidences/{visit_id}/...`.
   - Verify the `visit_id` in path belongs to the `auth.uid()` promoter.
4. **Restricted Access (SELECT)**:
   - Allow `admin` full access.
   - Allow `promoter` access ONLY to their own visit files.
   - Allow `industry` access ONLY if they are linked to the store/visit (via industry_id).
5. **No Anonymous Access**: Revoke all public/anon grants if any exist at storage level.

### Application Logic

#### `src/routes/_authenticated/promoter/visit.$visitId.tsx`
- **Security Fix**: Replace `getPublicUrl` with `getSignedUrl` server function for previewing captured evidences.
- **Path Enforcement**: Ensure uploaded files always follow the `evidences/{visitId}/...` pattern.

#### `src/lib/execution.functions.ts`
- **Signed URLs**: Update `getSignedUrl` to include ownership validation for promoters (admins already have full access).

#### `src/lib/app-config.ts` (or similar)
- Verify `PUBLIC_APP_URL` is consistent for URL generation.

## Technical Details

### SQL Migration
```sql
-- 1. Ensure bucket is private
update storage.buckets set public = false where id = 'visit-evidences';

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
```

## Verification Plan

### Automated Tests (via Shell/Playwright)
1. **Anon Test**: Attempt to download a known path without a session -> Expect 401/403.
2. **Promoter Isolation**: Try to upload/read file in a `visit_id` folder that belongs to another promoter -> Expect failure.
3. **Signed URL Test**: Verify `getSignedUrl` returns a working temporary link and `getPublicUrl` returns a 403 when accessed.

### Manual Verification
- Check Supabase Linter for "Public Bucket" or "Open Storage Policy" warnings.
- Verify promoter dashboard still shows images correctly using the new signed URL logic.
