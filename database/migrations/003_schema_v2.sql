-- 003_schema_v2.sql
-- Neues, performance‑orientiertes Schema (app_v2) mit tenant_id an erster Stelle,
-- vereinfachten Beziehungen, einheitlicher RLS und besserer Index‑Strategie.
-- Data‑Preservation: Nur NEUE Objekte unter app_v2. Bestehendes Schema bleibt unberührt.

begin;

create schema if not exists app_v2;

-- Helper-Funktionen werden im public-Schema bereitgestellt (siehe 001_optimize_existing.sql)
-- Erwartet: public.is_tenant_member(uuid), public.is_tenant_admin(uuid)

-- TENANTS
create table if not exists app_v2.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- MEMBERSHIPS (tenant_id zuerst, Unique pro (tenant_id, user_id))
create table if not exists app_v2.memberships (
  tenant_id uuid not null references app_v2.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','sales_admin','agent','viewer')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index if not exists idx_v2_memberships_user on app_v2.memberships(user_id);

-- LEADS (tenant_id zuerst), id bleibt PK; Composite Unique sichert Composite-FK in Child-Tabellen
create table if not exists app_v2.leads (
  tenant_id uuid not null references app_v2.tenants(id) on delete restrict,
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  name text,
  phone text,
  email text,
  address text,
  status_since timestamptz,
  lead_status text,
  contact_type text,
  phone_status text,
  follow_up boolean,
  follow_up_date date,
  follow_up_time text,
  exported_to_sap boolean,
  lat double precision,
  lng double precision,
  documentation text,
  doc_link text,
  calendar_link text,
  next_action text,
  next_action_date date,
  next_action_time text,
  preliminary_offer boolean,
  lost_reason text,
  unique (tenant_id, id)
);
create index if not exists idx_v2_leads_tenant on app_v2.leads(tenant_id);
create index if not exists idx_v2_leads_user on app_v2.leads(tenant_id, user_id);
create index if not exists idx_v2_leads_created on app_v2.leads(tenant_id, created_at desc);

-- APPOINTMENTS (tenant_id, lead_id referenziert Composite aus leads)
create table if not exists app_v2.appointments (
  tenant_id uuid not null references app_v2.tenants(id) on delete restrict,
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  starts_at timestamptz not null,
  status text,
  notes text,
  calendar_link text,
  external_event_id text,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, lead_id) references app_v2.leads(tenant_id, id) on delete cascade
);
create index if not exists idx_v2_appt_tenant_start on app_v2.appointments(tenant_id, starts_at);
create index if not exists idx_v2_appt_tenant_lead on app_v2.appointments(tenant_id, lead_id);

-- ENHANCED FOLLOW UPS (EFU)
create type if not exists app_v2_enhanced_followup_type as enum ('call','offer_followup','meeting','custom');
create type if not exists app_v2_enhanced_followup_priority as enum ('low','medium','high','overdue');

create table if not exists app_v2.enhanced_follow_ups (
  tenant_id uuid not null references app_v2.tenants(id) on delete restrict,
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  type app_v2_enhanced_followup_type not null,
  due_date date not null,
  priority app_v2_enhanced_followup_priority not null default 'medium',
  auto_generated boolean not null default false,
  escalation_level integer not null default 0,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, lead_id) references app_v2.leads(tenant_id, id) on delete cascade
);
create index if not exists idx_v2_efu_tenant_due on app_v2.enhanced_follow_ups(tenant_id, due_date, completed_at);

-- NOTIFICATIONS
create table if not exists app_v2.notifications (
  tenant_id uuid not null references app_v2.tenants(id) on delete cascade,
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  action_url text,
  priority text,
  action_data_json jsonb,
  snoozed_until timestamptz,
  category text,
  archived_at timestamptz
);
create index if not exists idx_v2_notifications_user_tenant on app_v2.notifications(user_id, tenant_id);
create index if not exists idx_v2_notifications_tenant_created on app_v2.notifications(tenant_id, created_at desc);

-- SAVED VIEWS
create table if not exists app_v2.saved_views (
  tenant_id uuid not null references app_v2.tenants(id) on delete cascade,
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  filters_json jsonb not null,
  is_default boolean not null default false,
  shared_to_all boolean not null default false,
  slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (tenant_id, user_id, slug)
);
create index if not exists idx_v2_saved_views_tenant_user on app_v2.saved_views(tenant_id, user_id);

-- Einheitliche RLS: eine Policy pro Tabelle (select+write), via Helper-Funktionen
alter table app_v2.tenants enable row level security;
do $$ begin
  drop policy if exists tenants_all on app_v2.tenants;
  create policy tenants_all on app_v2.tenants
    for all using (
      exists (select 1 from app_v2.memberships m where m.tenant_id = tenants.id and m.user_id = auth.uid())
    ) with check (
      exists (select 1 from app_v2.memberships m where m.tenant_id = tenants.id and m.user_id = auth.uid())
    );
end $$;

alter table app_v2.memberships enable row level security;
do $$ begin
  drop policy if exists memberships_all on app_v2.memberships;
  create policy memberships_all on app_v2.memberships
    for all using (memberships.user_id = auth.uid())
    with check (memberships.user_id = auth.uid());
end $$;

alter table app_v2.leads enable row level security;
do $$ begin
  drop policy if exists leads_all on app_v2.leads;
  create policy leads_all on app_v2.leads
    for all using (
      public.is_tenant_member(leads.tenant_id) and (public.is_tenant_admin(leads.tenant_id) or leads.user_id = auth.uid())
    ) with check (
      public.is_tenant_member(leads.tenant_id) and (public.is_tenant_admin(leads.tenant_id) or leads.user_id = auth.uid())
    );
end $$;

alter table app_v2.appointments enable row level security;
do $$ begin
  drop policy if exists appt_all on app_v2.appointments;
  create policy appt_all on app_v2.appointments
    for all using (
      public.is_tenant_member(appointments.tenant_id) and (
        public.is_tenant_admin(appointments.tenant_id) or exists (
          select 1 from app_v2.leads l where l.tenant_id = appointments.tenant_id and l.id = appointments.lead_id and l.user_id = auth.uid()
        )
      )
    ) with check (
      public.is_tenant_member(appointments.tenant_id) and (
        public.is_tenant_admin(appointments.tenant_id) or exists (
          select 1 from app_v2.leads l where l.tenant_id = appointments.tenant_id and l.id = appointments.lead_id and l.user_id = auth.uid()
        )
      )
    );
end $$;

alter table app_v2.enhanced_follow_ups enable row level security;
do $$ begin
  drop policy if exists efu_all on app_v2.enhanced_follow_ups;
  create policy efu_all on app_v2.enhanced_follow_ups
    for all using (
      public.is_tenant_member(enhanced_follow_ups.tenant_id) and (
        public.is_tenant_admin(enhanced_follow_ups.tenant_id) or exists (
          select 1 from app_v2.leads l where l.tenant_id = enhanced_follow_ups.tenant_id and l.id = enhanced_follow_ups.lead_id and l.user_id = auth.uid()
        )
      )
    ) with check (
      public.is_tenant_member(enhanced_follow_ups.tenant_id) and (
        public.is_tenant_admin(enhanced_follow_ups.tenant_id) or exists (
          select 1 from app_v2.leads l where l.tenant_id = enhanced_follow_ups.tenant_id and l.id = enhanced_follow_ups.lead_id and l.user_id = auth.uid()
        )
      )
    );
end $$;

alter table app_v2.notifications enable row level security;
do $$ begin
  drop policy if exists notif_all on app_v2.notifications;
  create policy notif_all on app_v2.notifications
    for all using (notifications.user_id = auth.uid() and public.is_tenant_member(notifications.tenant_id))
    with check (notifications.user_id = auth.uid() and public.is_tenant_member(notifications.tenant_id));
end $$;

alter table app_v2.saved_views enable row level security;
do $$ begin
  drop policy if exists views_all on app_v2.saved_views;
  create policy views_all on app_v2.saved_views
    for all using (
      (saved_views.user_id = auth.uid() and public.is_tenant_member(saved_views.tenant_id)) or coalesce(saved_views.shared_to_all, false) = true
    ) with check (saved_views.user_id = auth.uid() and public.is_tenant_member(saved_views.tenant_id));
end $$;

commit;


