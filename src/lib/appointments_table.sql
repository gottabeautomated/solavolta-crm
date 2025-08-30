-- Appointments-Tabelle für mehrere Termine pro Lead
-- Ausführen im Supabase SQL Editor

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  starts_at timestamptz not null,
  notes text,
  calendar_link text,
  external_event_id text,
  status text default 'scheduled',
  created_at timestamptz not null default now()
);

-- Indizes
create index if not exists idx_appointments_lead_id on public.appointments(lead_id);
create index if not exists idx_appointments_starts_at on public.appointments(starts_at);

-- RLS aktivieren
alter table public.appointments enable row level security;

-- RLS Policies: Nutzer darf nur Termine seiner Leads sehen/bearbeiten
do $$ begin
  if not exists (
    select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = 'appointments' and p.policyname = 'appointments_select'
  ) then
    create policy appointments_select on public.appointments
      for select
      using (exists (
        select 1 from public.leads l where l.id = appointments.lead_id and l.user_id = auth.uid()
      ));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = 'appointments' and p.policyname = 'appointments_insert'
  ) then
    create policy appointments_insert on public.appointments
      for insert
      with check (exists (
        select 1 from public.leads l where l.id = appointments.lead_id and l.user_id = auth.uid()
      ));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = 'appointments' and p.policyname = 'appointments_update'
  ) then
    create policy appointments_update on public.appointments
      for update
      using (exists (
        select 1 from public.leads l where l.id = appointments.lead_id and l.user_id = auth.uid()
      ));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = 'appointments' and p.policyname = 'appointments_delete'
  ) then
    create policy appointments_delete on public.appointments
      for delete
      using (exists (
        select 1 from public.leads l where l.id = appointments.lead_id and l.user_id = auth.uid()
      ));
  end if;
end $$;

-- View: nächster Termin je Lead
create or replace view public.lead_next_appointments as
  select a.lead_id,
         min(a.starts_at) as next_starts_at
  from public.appointments a
  where a.starts_at >= now()
  group by a.lead_id;


