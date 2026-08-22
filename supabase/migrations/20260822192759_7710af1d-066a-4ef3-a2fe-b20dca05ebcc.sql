-- Enum for export status
create type public.export_status as enum ('solicitada', 'processando', 'pronta', 'falhou', 'expirada');

-- Enum for export format
create type public.export_format as enum ('xlsx', 'csv', 'json', 'pdf', 'zip');

-- Table for tracking export tasks
create table public.export_tasks (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    user_id uuid references auth.users(id) not null,
    industry_id uuid references public.industries(id),
    status public.export_status not null default 'solicitada',
    format public.export_format not null,
    filters jsonb not null default '{}'::jsonb,
    file_path text,
    expires_at timestamptz,
    error_message text,
    download_count int not null default 0,
    last_downloaded_at timestamptz
);

-- Grant access
grant select, insert, update on public.export_tasks to authenticated;
grant all on public.export_tasks to service_role;

-- Enable RLS
alter table public.export_tasks enable row level security;

-- Policies
create policy "Users can view their own exports"
on public.export_tasks
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all exports"
on public.export_tasks
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Users can request exports"
on public.export_tasks
for insert
to authenticated
with check (auth.uid() = user_id);

-- Storage policies for exports
create policy "Authenticated users can read their own export files"
on storage.objects
for select
to authenticated
using (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Admins can read all export files"
on storage.objects
for select
to authenticated
using (bucket_id = 'exports' and public.has_role(auth.uid(), 'admin'));

-- Function to handle export expiry
create or replace function public.cleanup_expired_exports()
returns void
language plpgsql
security definer
as $$
begin
  update public.export_tasks
  set status = 'expirada'
  where status = 'pronta' and expires_at < now();
end;
$$;
