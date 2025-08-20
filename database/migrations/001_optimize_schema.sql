-- 001_optimize_schema.sql
-- Ziel: Performance, saubere FK-Beziehungen, konsolidierte RLS auf Basis von Helper-Funktionen
-- Idempotent und ohne Datenverlust. Neue FK werden zunächst NOT VALID gesetzt.

begin;

-- Extensions (idempotent)
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Helper-Funktionen für RLS (vermeiden wiederholte Subqueries)
-- Prüft, ob aktueller User Mitglied des Tenants ist
create or replace function public.is_tenant_member(p_tenant_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.tenant_id = p_tenant_id and m.user_id = coalesce(p_user_id, auth.uid())
  );
$$;

-- Prüft, ob aktueller User Admin-Rolle im Tenant hat
create or replace function public.is_tenant_admin(p_tenant_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.tenant_id = p_tenant_id and m.user_id = coalesce(p_user_id, auth.uid())
      and m.role in ('owner','admin','sales_admin')
  );
$$;

-- Sichtbarkeit
grant execute on function public.is_tenant_member(uuid, uuid) to anon, authenticated, service_role;
grant execute on function public.is_tenant_admin(uuid, uuid) to anon, authenticated, service_role;

-- Indizes: memberships
create unique index if not exists idx_memberships_user_tenant_unique on public.memberships(user_id, tenant_id);
create index if not exists idx_memberships_tenant_role on public.memberships(tenant_id, role);
create index if not exists idx_memberships_user on public.memberships(user_id);

-- Indizes: leads
create index if not exists idx_leads_tenant on public.leads(tenant_id);
create index if not exists idx_leads_user on public.leads(user_id);
create index if not exists idx_leads_tenant_user on public.leads(tenant_id, user_id);
create index if not exists idx_leads_created_at on public.leads(created_at desc);

-- Indizes: enhanced_follow_ups
create index if not exists idx_efu_tenant_due_completed on public.enhanced_follow_ups(tenant_id, due_date, completed_at);

-- Indizes: appointments
create index if not exists idx_appointments_tenant on public.appointments(tenant_id);
create index if not exists idx_appointments_lead on public.appointments(lead_id);
create index if not exists idx_appointments_tenant_starts on public.appointments(tenant_id, starts_at);
create index if not exists idx_appointments_tenant_status on public.appointments(tenant_id, status);

-- Indizes: notifications
create index if not exists idx_notifications_user_tenant on public.notifications(user_id, tenant_id);
create index if not exists idx_notifications_tenant_created on public.notifications(tenant_id, created_at desc);
create index if not exists idx_notifications_user_active on public.notifications(user_id) where archived_at is null;

-- Indizes: saved_views
create index if not exists idx_saved_views_tenant_user on public.saved_views(tenant_id, user_id);
create unique index if not exists uq_saved_views_slug_per_user_tenant on public.saved_views(tenant_id, user_id, slug) where slug is not null;
create index if not exists idx_saved_views_is_default on public.saved_views(tenant_id, user_id, is_default);

-- FK-Beziehungen (zunächst NOT VALID; werden nach Bereinigung validiert)
do $$
begin
  -- leads
  alter table if exists public.leads
    add constraint fk_leads_tenant
    foreign key (tenant_id) references public.tenants(id) on delete restrict not valid;
exception when duplicate_object then null; end $$;

do $$
begin
  alter table if exists public.leads
    add constraint fk_leads_user
    foreign key (user_id) references auth.users(id) on delete set null not valid;
exception when duplicate_object then null; end $$;

-- appointments
do $$ begin
  alter table if exists public.appointments
    add constraint fk_appt_tenant foreign key (tenant_id) references public.tenants(id) on delete restrict not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table if exists public.appointments
    add constraint fk_appt_lead foreign key (lead_id) references public.leads(id) on delete cascade not valid;
exception when duplicate_object then null; end $$;

-- enhanced_follow_ups
do $$ begin
  alter table if exists public.enhanced_follow_ups
    add constraint fk_efu_tenant foreign key (tenant_id) references public.tenants(id) on delete restrict not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table if exists public.enhanced_follow_ups
    add constraint fk_efu_lead foreign key (lead_id) references public.leads(id) on delete cascade not valid;
exception when duplicate_object then null; end $$;

-- notifications
do $$ begin
  alter table if exists public.notifications
    add constraint fk_notifications_tenant foreign key (tenant_id) references public.tenants(id) on delete cascade not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table if exists public.notifications
    add constraint fk_notifications_user foreign key (user_id) references auth.users(id) on delete cascade not valid;
exception when duplicate_object then null; end $$;

-- saved_views
do $$ begin
  alter table if exists public.saved_views
    add constraint fk_saved_views_tenant foreign key (tenant_id) references public.tenants(id) on delete cascade not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table if exists public.saved_views
    add constraint fk_saved_views_user foreign key (user_id) references auth.users(id) on delete cascade not valid;
exception when duplicate_object then null; end $$;

-- memberships (zusätzliche Sicherung)
do $$ begin
  alter table if exists public.memberships
    add constraint fk_memberships_tenant foreign key (tenant_id) references public.tenants(id) on delete cascade not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table if exists public.memberships
    add constraint fk_memberships_user foreign key (user_id) references auth.users(id) on delete cascade not valid;
exception when duplicate_object then null; end $$;

-- RLS: Leads mit Rollentrennung (Admins sehen alle im Tenant, sonst nur eigene)
alter table if exists public.leads enable row level security;
do $$
begin
  drop policy if exists leads_select_role_or_owner on public.leads;
  create policy leads_select_role_or_owner on public.leads
    for select using (
      public.is_tenant_member(leads.tenant_id)
      and (public.is_tenant_admin(leads.tenant_id) or leads.user_id = auth.uid())
    );

  drop policy if exists leads_modify_role_or_owner on public.leads;
  create policy leads_modify_role_or_owner on public.leads
    for all using (
      public.is_tenant_member(leads.tenant_id)
      and (public.is_tenant_admin(leads.tenant_id) or leads.user_id = auth.uid())
    ) with check (
      public.is_tenant_member(leads.tenant_id)
      and (public.is_tenant_admin(leads.tenant_id) or leads.user_id = auth.uid())
    );
end $$;

-- RLS: Enhanced Follow Ups (sichtbar nur für Admins oder Owner des Leads)
alter table if exists public.enhanced_follow_ups enable row level security;
do $$
begin
  drop policy if exists efu_select_role_or_owner on public.enhanced_follow_ups;
  create policy efu_select_role_or_owner on public.enhanced_follow_ups
    for select using (
      public.is_tenant_member(enhanced_follow_ups.tenant_id)
      and (
        public.is_tenant_admin(enhanced_follow_ups.tenant_id)
        or exists (select 1 from public.leads l where l.id = enhanced_follow_ups.lead_id and l.tenant_id = enhanced_follow_ups.tenant_id and l.user_id = auth.uid())
      )
    );

  drop policy if exists efu_write_role_or_owner on public.enhanced_follow_ups;
  create policy efu_write_role_or_owner on public.enhanced_follow_ups
    for all using (
      public.is_tenant_member(enhanced_follow_ups.tenant_id)
      and (
        public.is_tenant_admin(enhanced_follow_ups.tenant_id)
        or exists (select 1 from public.leads l where l.id = enhanced_follow_ups.lead_id and l.tenant_id = enhanced_follow_ups.tenant_id and l.user_id = auth.uid())
      )
    ) with check (
      public.is_tenant_member(enhanced_follow_ups.tenant_id)
      and (
        public.is_tenant_admin(enhanced_follow_ups.tenant_id)
        or exists (select 1 from public.leads l where l.id = enhanced_follow_ups.lead_id and l.tenant_id = enhanced_follow_ups.tenant_id and l.user_id = auth.uid())
      )
    );
end $$;

-- RLS: Appointments analog zu EFU
alter table if exists public.appointments enable row level security;
do $$
begin
  drop policy if exists appt_select_role_or_owner on public.appointments;
  create policy appt_select_role_or_owner on public.appointments
    for select using (
      public.is_tenant_member(appointments.tenant_id)
      and (
        public.is_tenant_admin(appointments.tenant_id)
        or exists (select 1 from public.leads l where l.id = appointments.lead_id and l.tenant_id = appointments.tenant_id and l.user_id = auth.uid())
      )
    );

  drop policy if exists appt_write_role_or_owner on public.appointments;
  create policy appt_write_role_or_owner on public.appointments
    for all using (
      public.is_tenant_member(appointments.tenant_id)
      and (
        public.is_tenant_admin(appointments.tenant_id)
        or exists (select 1 from public.leads l where l.id = appointments.lead_id and l.tenant_id = appointments.tenant_id and l.user_id = auth.uid())
      )
    ) with check (
      public.is_tenant_member(appointments.tenant_id)
      and (
        public.is_tenant_admin(appointments.tenant_id)
        or exists (select 1 from public.leads l where l.id = appointments.lead_id and l.tenant_id = appointments.tenant_id and l.user_id = auth.uid())
      )
    );
end $$;

-- RLS: Notifications – nur eigene Nutzer + Tenant-Mitgliedschaft
alter table if exists public.notifications enable row level security;
do $$
begin
  drop policy if exists notifications_user_scoped on public.notifications;
  create policy notifications_user_scoped on public.notifications
    for all using (
      notifications.user_id = auth.uid() and public.is_tenant_member(notifications.tenant_id)
    ) with check (
      notifications.user_id = auth.uid() and public.is_tenant_member(notifications.tenant_id)
    );
end $$;

-- RLS: saved_views – nur Besitzer (oder optional tenant-weit, wenn shared_to_all)
alter table if exists public.saved_views enable row level security;
do $$
begin
  drop policy if exists saved_views_policy on public.saved_views;
  create policy saved_views_policy on public.saved_views
    for all using (
      (saved_views.user_id = auth.uid() and public.is_tenant_member(saved_views.tenant_id))
      or coalesce(saved_views.shared_to_all, false) = true
    ) with check (
      saved_views.user_id = auth.uid() and public.is_tenant_member(saved_views.tenant_id)
    );
end $$;

commit;


