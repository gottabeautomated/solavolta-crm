-- 001_optimize_existing.sql
-- Ziel: 50% schnellere Queries durch Index-/Policy-Vereinfachungen und saubere Membership-Joins
-- Idempotent. Keine destruktiven Schemaänderungen ohne NOT VALID/prüfende Schritte.

begin;

-- 1) Basis-Extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- 2) Helper-Funktionen für RLS (einheitlich, sicher, schnell)
create or replace function public.is_tenant_member(p_tenant_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.tenant_id = p_tenant_id and m.user_id = coalesce(p_user_id, auth.uid())
  );
$$;

create or replace function public.is_tenant_admin(p_tenant_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.tenant_id = p_tenant_id and m.user_id = coalesce(p_user_id, auth.uid())
      and m.role in ('owner','admin','sales_admin')
  );
$$;

grant execute on function public.is_tenant_member(uuid, uuid) to anon, authenticated, service_role;
grant execute on function public.is_tenant_admin(uuid, uuid) to anon, authenticated, service_role;

-- 3) Index-Optimierungen
-- Memberships
create unique index if not exists idx_memberships_user_tenant_unique on public.memberships(user_id, tenant_id);
create index if not exists idx_memberships_tenant_role on public.memberships(tenant_id, role);
create index if not exists idx_memberships_user on public.memberships(user_id);

-- Leads
create index if not exists idx_leads_tenant on public.leads(tenant_id);
create index if not exists idx_leads_user on public.leads(user_id);
create index if not exists idx_leads_tenant_user on public.leads(tenant_id, user_id);
create index if not exists idx_leads_created_desc on public.leads(tenant_id, created_at desc);

-- Enhanced Follow Ups (EFU)
create index if not exists idx_efu_tenant_due_completed on public.enhanced_follow_ups(tenant_id, due_date, completed_at);
create index if not exists idx_efu_tenant_lead on public.enhanced_follow_ups(tenant_id, lead_id);

-- Appointments
create index if not exists idx_appt_tenant_starts on public.appointments(tenant_id, starts_at);
create index if not exists idx_appt_tenant_status on public.appointments(tenant_id, status);
create index if not exists idx_appt_tenant_lead on public.appointments(tenant_id, lead_id);

-- Notifications
create index if not exists idx_notifications_user_tenant on public.notifications(user_id, tenant_id);
create index if not exists idx_notifications_tenant_created on public.notifications(tenant_id, created_at desc);
create index if not exists idx_notifications_user_active on public.notifications(user_id) where archived_at is null;

-- Saved Views
create index if not exists idx_saved_views_tenant_user on public.saved_views(tenant_id, user_id);
create unique index if not exists uq_saved_views_slug_per_user_tenant on public.saved_views(tenant_id, user_id, slug) where slug is not null;

-- 4) RLS-Policy-Vereinfachungen (Drop alt, Create neu mit Helpern)
-- Leads
alter table if exists public.leads enable row level security;
do $$
begin
  drop policy if exists leads_select on public.leads;
  drop policy if exists leads_select_tenant on public.leads;
  drop policy if exists leads_mod_tenant on public.leads;
  drop policy if exists leads_select_role_or_owner on public.leads;
  drop policy if exists leads_modify_role_or_owner on public.leads;

  create policy leads_select_role_or_owner on public.leads
    for select using (
      public.is_tenant_member(leads.tenant_id) and (public.is_tenant_admin(leads.tenant_id) or leads.user_id = auth.uid())
    );
  create policy leads_modify_role_or_owner on public.leads
    for all using (
      public.is_tenant_member(leads.tenant_id) and (public.is_tenant_admin(leads.tenant_id) or leads.user_id = auth.uid())
    ) with check (
      public.is_tenant_member(leads.tenant_id) and (public.is_tenant_admin(leads.tenant_id) or leads.user_id = auth.uid())
    );
end $$;

-- EFU
alter table if exists public.enhanced_follow_ups enable row level security;
do $$
begin
  drop policy if exists efu_select on public.enhanced_follow_ups;
  drop policy if exists efu_insert on public.enhanced_follow_ups;
  drop policy if exists efu_update on public.enhanced_follow_ups;
  drop policy if exists efu_delete on public.enhanced_follow_ups;
  drop policy if exists efu_select_role_or_owner on public.enhanced_follow_ups;
  drop policy if exists efu_write_role_or_owner on public.enhanced_follow_ups;

  create policy efu_select_role_or_owner on public.enhanced_follow_ups
    for select using (
      public.is_tenant_member(enhanced_follow_ups.tenant_id) and (
        public.is_tenant_admin(enhanced_follow_ups.tenant_id)
        or exists (
          select 1 from public.leads l
          where l.id = enhanced_follow_ups.lead_id and l.tenant_id = enhanced_follow_ups.tenant_id and l.user_id = auth.uid()
        )
      )
    );
  create policy efu_write_role_or_owner on public.enhanced_follow_ups
    for all using (
      public.is_tenant_member(enhanced_follow_ups.tenant_id) and (
        public.is_tenant_admin(enhanced_follow_ups.tenant_id)
        or exists (
          select 1 from public.leads l
          where l.id = enhanced_follow_ups.lead_id and l.tenant_id = enhanced_follow_ups.tenant_id and l.user_id = auth.uid()
        )
      )
    ) with check (
      public.is_tenant_member(enhanced_follow_ups.tenant_id) and (
        public.is_tenant_admin(enhanced_follow_ups.tenant_id)
        or exists (
          select 1 from public.leads l
          where l.id = enhanced_follow_ups.lead_id and l.tenant_id = enhanced_follow_ups.tenant_id and l.user_id = auth.uid()
        )
      )
    );
end $$;

-- Appointments
alter table if exists public.appointments enable row level security;
do $$
begin
  drop policy if exists appt_select_role_or_owner on public.appointments;
  drop policy if exists appt_write_role_or_owner on public.appointments;
  create policy appt_select_role_or_owner on public.appointments
    for select using (
      public.is_tenant_member(appointments.tenant_id) and (
        public.is_tenant_admin(appointments.tenant_id)
        or exists (select 1 from public.leads l where l.id = appointments.lead_id and l.tenant_id = appointments.tenant_id and l.user_id = auth.uid())
      )
    );
  create policy appt_write_role_or_owner on public.appointments
    for all using (
      public.is_tenant_member(appointments.tenant_id) and (
        public.is_tenant_admin(appointments.tenant_id)
        or exists (select 1 from public.leads l where l.id = appointments.lead_id and l.tenant_id = appointments.tenant_id and l.user_id = auth.uid())
      )
    ) with check (
      public.is_tenant_member(appointments.tenant_id) and (
        public.is_tenant_admin(appointments.tenant_id)
        or exists (select 1 from public.leads l where l.id = appointments.lead_id and l.tenant_id = appointments.tenant_id and l.user_id = auth.uid())
      )
    );
end $$;

-- Notifications (nur eigener User)
alter table if exists public.notifications enable row level security;
do $$
begin
  drop policy if exists notifications_user_scoped on public.notifications;
  create policy notifications_user_scoped on public.notifications
    for all using (notifications.user_id = auth.uid() and public.is_tenant_member(notifications.tenant_id))
    with check (notifications.user_id = auth.uid() and public.is_tenant_member(notifications.tenant_id));
end $$;

-- Saved Views
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

-- 5) Datenbereinigung (leichtgewichtig, idempotent)
-- Duplizierte memberships entfernen
with cte as (
  select user_id, tenant_id, min(created_at) as keep_ts
  from public.memberships
  group by user_id, tenant_id
)
delete from public.memberships m
using cte
where (m.user_id, m.tenant_id) in (select user_id, tenant_id from cte)
  and m.created_at <> cte.keep_ts;

commit;


