-- Multi-tenant Setup: Tenants, Memberships, Invitations, RLS-Policies
-- Ausführen im Supabase SQL Editor (public Schema, außer Storage-Policies)

create extension if not exists pgcrypto;

do $$ begin
  if not exists (select 1 from pg_type where typname='tenant_status') then
    create type tenant_status as enum ('active','inactive');
  end if;
end $$;

-- 1) Tenants & Memberships
create table if not exists public.tenants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  domain     text unique,
  status     tenant_status not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id)     on delete cascade,
  role       text not null default 'agent' check (role in ('owner','admin','agent','viewer')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index if not exists idx_memberships_tenant_id on public.memberships(tenant_id);
create index if not exists idx_memberships_user_id   on public.memberships(user_id);

alter table public.memberships enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='memberships' and policyname='memberships_select') then
    create policy memberships_select on public.memberships
      for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='memberships' and policyname='memberships_insert') then
    create policy memberships_insert on public.memberships
      for insert with check (user_id = auth.uid());
  end if;
end $$;

alter table public.tenants enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='tenants' and policyname='tenants_select_on_membership') then
    create policy tenants_select_on_membership on public.tenants
      for select using (
        exists (select 1 from public.memberships m where m.tenant_id = tenants.id and m.user_id = auth.uid())
      );
  end if;
end $$;

-- 2) tenant_id in Fach-Tabellen
-- Leads
alter table public.leads add column if not exists tenant_id uuid;
do $$ begin
  if exists (select 1 from public.tenants) then
    update public.leads set tenant_id = (select id from public.tenants order by created_at asc limit 1) where tenant_id is null;
  end if;
end $$;
alter table public.leads alter column tenant_id set not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='leads_tenant_id_fkey') then
    alter table public.leads add constraint leads_tenant_id_fkey foreign key (tenant_id)
      references public.tenants(id) on update cascade on delete restrict;
  end if;
end $$;
create index if not exists idx_leads_tenant_id on public.leads(tenant_id);
alter table public.leads enable row level security;

-- Optional: Vorherige, zu breite Policies entfernen
do $$ begin
  if exists (select 1 from pg_policies where tablename='leads' and policyname='Leads sind für alle authentifizierten User sichtbar') then
    drop policy "Leads sind für alle authentifizierten User sichtbar" on public.leads;
  end if;
  if exists (select 1 from pg_policies where tablename='leads' and policyname='Users can view own leads') then
    drop policy "Users can view own leads" on public.leads;
  end if;
  if exists (select 1 from pg_policies where tablename='leads' and policyname='Users can insert own leads') then
    drop policy "Users can insert own leads" on public.leads;
  end if;
  if exists (select 1 from pg_policies where tablename='leads' and policyname='Users can update own leads') then
    drop policy "Users can update own leads" on public.leads;
  end if;
  if exists (select 1 from pg_policies where tablename='leads' and policyname='Users can delete own leads') then
    drop policy "Users can delete own leads" on public.leads;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='leads' and policyname='leads_select') then
    create policy leads_select on public.leads
      for select using (
        exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = leads.tenant_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='leads' and policyname='leads_insert') then
    create policy leads_insert on public.leads
      for insert with check (
        exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = leads.tenant_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='leads' and policyname='leads_update') then
    create policy leads_update on public.leads
      for update using (
        exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = leads.tenant_id)
      ) with check (
        exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = leads.tenant_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='leads' and policyname='leads_delete') then
    create policy leads_delete on public.leads
      for delete using (
        exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = leads.tenant_id)
      );
  end if;
end $$;

-- Appointments
alter table public.appointments add column if not exists tenant_id uuid;
update public.appointments a set tenant_id = l.tenant_id from public.leads l where l.id = a.lead_id and a.tenant_id is null;
alter table public.appointments alter column tenant_id set not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='appointments_tenant_id_fkey') then
    alter table public.appointments add constraint appointments_tenant_id_fkey foreign key (tenant_id)
      references public.tenants(id) on update cascade on delete restrict;
  end if;
end $$;
create index if not exists idx_appointments_tenant_id on public.appointments(tenant_id);
alter table public.appointments enable row level security;
do $$ begin
  perform 1; -- no-op block to keep DO consistent
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='appointments' and policyname='appointments_select') then
    create policy appointments_select on public.appointments
      for select using (
        exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = appointments.tenant_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='appointments' and policyname='appointments_insert') then
    create policy appointments_insert on public.appointments
      for insert with check (
        exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = appointments.tenant_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='appointments' and policyname='appointments_update') then
    create policy appointments_update on public.appointments
      for update using (
        exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = appointments.tenant_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='appointments' and policyname='appointments_delete') then
    create policy appointments_delete on public.appointments
      for delete using (
        exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = appointments.tenant_id)
      );
  end if;
end $$;

-- Status Changes
alter table public.status_changes add column if not exists tenant_id uuid;
update public.status_changes s set tenant_id = l.tenant_id from public.leads l where l.id = s.lead_id and s.tenant_id is null;
alter table public.status_changes alter column tenant_id set not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='status_changes_tenant_id_fkey') then
    alter table public.status_changes add constraint status_changes_tenant_id_fkey foreign key (tenant_id)
      references public.tenants(id) on update cascade on delete restrict;
  end if;
end $$;
create index if not exists idx_status_changes_tenant_id on public.status_changes(tenant_id);
alter table public.status_changes enable row level security;
do $$ begin
  -- Drop alte Policies, falls vorhanden
  if exists (select 1 from pg_policies where tablename='status_changes' and policyname='Users can view status changes for leads they have access to') then
    drop policy "Users can view status changes for leads they have access to" on public.status_changes;
  end if;
  if exists (select 1 from pg_policies where tablename='status_changes' and policyname='Users can insert status changes for their leads') then
    drop policy "Users can insert status changes for their leads" on public.status_changes;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='status_changes' and policyname='status_changes_select') then
    create policy status_changes_select on public.status_changes
      for select using (
        exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = status_changes.tenant_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='status_changes' and policyname='status_changes_insert') then
    create policy status_changes_insert on public.status_changes
      for insert with check (
        exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = status_changes.tenant_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='status_changes' and policyname='status_changes_update') then
    create policy status_changes_update on public.status_changes
      for update using (
        exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = status_changes.tenant_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='status_changes' and policyname='status_changes_delete') then
    create policy status_changes_delete on public.status_changes
      for delete using (
        exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = status_changes.tenant_id)
      );
  end if;
end $$;

-- Notifications
alter table public.notifications add column if not exists tenant_id uuid;
alter table public.notifications enable row level security;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='notifications_tenant_id_fkey') then
    alter table public.notifications add constraint notifications_tenant_id_fkey foreign key (tenant_id)
      references public.tenants(id) on update cascade on delete restrict;
  end if;
end $$;
create index if not exists idx_notifications_tenant_id on public.notifications(tenant_id);
-- Drop user-only policies and replace with tenant-aware
do $$ begin
  if exists (select 1 from pg_policies where tablename='notifications' and policyname='Users can view their own notifications') then
    drop policy "Users can view their own notifications" on public.notifications;
  end if;
  if exists (select 1 from pg_policies where tablename='notifications' and policyname='Users can insert notifications for themselves') then
    drop policy "Users can insert notifications for themselves" on public.notifications;
  end if;
  if exists (select 1 from pg_policies where tablename='notifications' and policyname='Users can update their own notifications') then
    drop policy "Users can update their own notifications" on public.notifications;
  end if;
  if exists (select 1 from pg_policies where tablename='notifications' and policyname='Users can delete their own notifications') then
    drop policy "Users can delete their own notifications" on public.notifications;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notifications_select') then
    create policy notifications_select on public.notifications
      for select using (
        user_id = auth.uid() and exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = notifications.tenant_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notifications_insert') then
    create policy notifications_insert on public.notifications
      for insert with check (
        user_id = auth.uid() and exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = notifications.tenant_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notifications_update') then
    create policy notifications_update on public.notifications
      for update using (
        user_id = auth.uid() and exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = notifications.tenant_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notifications_delete') then
    create policy notifications_delete on public.notifications
      for delete using (
        user_id = auth.uid() and exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = notifications.tenant_id)
      );
  end if;
end $$;

-- 3) Invitations + RPC
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role  text not null check (role in ('owner','admin','agent','viewer')) default 'agent',
  token text not null unique,
  invited_by uuid not null references auth.users(id) on delete restrict,
  accepted boolean not null default false,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create index if not exists idx_invitations_tenant_email on public.invitations(tenant_id, email);

alter table public.invitations enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='invitations' and policyname='invitations_select') then
    create policy invitations_select on public.invitations
      for select using (
        exists (
          select 1 from public.memberships m
          where m.tenant_id = invitations.tenant_id and m.user_id = auth.uid() and m.role in ('owner','admin')
        )
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='invitations' and policyname='invitations_insert') then
    create policy invitations_insert on public.invitations
      for insert with check (
        exists (
          select 1 from public.memberships m
          where m.tenant_id = invitations.tenant_id and m.user_id = auth.uid() and m.role in ('owner','admin')
        )
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='invitations' and policyname='invitations_update') then
    create policy invitations_update on public.invitations
      for update using (
        exists (
          select 1 from public.memberships m
          where m.tenant_id = invitations.tenant_id and m.user_id = auth.uid() and m.role in ('owner','admin')
        )
      );
  end if;
end $$;

create or replace function public.accept_invitations_for_current_user()
returns void language plpgsql security definer as $$
declare v_user_id uuid; v_email text; begin
  v_user_id := auth.uid();
  select email into v_email from auth.users where id = v_user_id;

  insert into public.memberships (tenant_id, user_id, role)
  select i.tenant_id, v_user_id, i.role
  from public.invitations i
  where i.email ilike v_email and i.accepted = false
  on conflict (tenant_id, user_id) do update set role = excluded.role;

  update public.invitations set accepted = true, accepted_at = now()
  where email ilike v_email and accepted = false;
end; $$;

-- 4) Storage Policies (im storage Schema anlegen)
-- Beispiel: Bucket 'offers' und 'tvp' – erlaubt Zugriff nur innerhalb des Tenant-Pfads
-- name format: tenant/<tenant_id>/user/<user_id>/leads/<lead_id>/<type>/<timestamp>_file.pdf
--
-- create policy if not exists storage_offers_select on storage.objects
--   for select to authenticated using (
--     bucket_id = 'offers' and exists (
--       select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = (split_part(name,'/',2))::uuid
--     )
--   );
-- -- analog: insert/update/delete und für Bucket 'tvp'


