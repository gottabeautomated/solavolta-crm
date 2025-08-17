-- Saved Views for personalized dashboards
create table if not exists public.saved_views (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  name text not null,
  filters_json jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  shared_to_all boolean not null default false,
  slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill columns when table already existed without them
alter table public.saved_views add column if not exists shared_to_all boolean not null default false;
alter table public.saved_views add column if not exists slug text;

create index if not exists idx_saved_views_tenant_user on public.saved_views(tenant_id, user_id);
create index if not exists idx_saved_views_default on public.saved_views(tenant_id, user_id, is_default) where is_default = true;
create index if not exists idx_saved_views_filters_gin on public.saved_views using gin (filters_json);
create index if not exists idx_saved_views_slug on public.saved_views(tenant_id, slug);

alter table public.saved_views enable row level security;

-- RLS: Users can CRUD only their own records within their tenant
do $$ begin
  if not exists (select 1 from pg_policies where tablename='saved_views' and policyname='saved_views_select') then
    create policy saved_views_select on public.saved_views for select using (
      exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = saved_views.tenant_id)
      and (saved_views.user_id = auth.uid() or saved_views.shared_to_all = true)
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='saved_views' and policyname='saved_views_insert') then
    create policy saved_views_insert on public.saved_views for insert with check (
      exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = saved_views.tenant_id)
      and (
        saved_views.user_id = auth.uid() or
        (saved_views.shared_to_all = true and exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = saved_views.tenant_id and m.role in ('owner','admin')))
      )
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='saved_views' and policyname='saved_views_update') then
    create policy saved_views_update on public.saved_views for update using (
      saved_views.user_id = auth.uid() or exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = saved_views.tenant_id and m.role in ('owner','admin'))
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='saved_views' and policyname='saved_views_delete') then
    create policy saved_views_delete on public.saved_views for delete using (
      saved_views.user_id = auth.uid() or exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = saved_views.tenant_id and m.role in ('owner','admin'))
    );
  end if;
end $$;

-- Keep updated_at fresh
create or replace function public.touch_saved_views() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists trg_touch_saved_views on public.saved_views;
create trigger trg_touch_saved_views before update on public.saved_views
for each row execute function public.touch_saved_views();


