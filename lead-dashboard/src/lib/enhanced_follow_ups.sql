-- Enhanced Follow Ups for Daily Dashboard (Multi-Tenant)
-- Ausführen im Supabase SQL Editor (Schema: public)

create extension if not exists pgcrypto;

-- 1) ENUM Types
do $$ begin
  if not exists (select 1 from pg_type where typname = 'enhanced_followup_type') then
    create type enhanced_followup_type as enum ('call','offer_followup','meeting','custom');
  end if;
  -- Fehlende Werte idempotent ergänzen (wird ignoriert, falls vorhanden)
  if not exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'enhanced_followup_type' and e.enumlabel = 'followup'
  ) then
    alter type enhanced_followup_type add value if not exists 'followup';
  end if;
  if not exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'enhanced_followup_type' and e.enumlabel = 'reengagement'
  ) then
    alter type enhanced_followup_type add value if not exists 'reengagement';
  end if;
  if not exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'enhanced_followup_type' and e.enumlabel = 'offer'
  ) then
    alter type enhanced_followup_type add value if not exists 'offer';
  end if;
  if not exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'enhanced_followup_type' and e.enumlabel = 'tvp'
  ) then
    alter type enhanced_followup_type add value if not exists 'tvp';
  end if;
  if not exists (select 1 from pg_type where typname = 'enhanced_followup_priority') then
    create type enhanced_followup_priority as enum ('low','medium','high','overdue');
  end if;
end $$;

-- 2) Tabelle
create table if not exists public.enhanced_follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  type enhanced_followup_type not null,
  due_date date not null,
  priority enhanced_followup_priority not null default 'medium',
  auto_generated boolean not null default false,
  escalation_level integer not null default 0,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- 3) Indizes (Performance)
create index if not exists idx_efu_tenant_id on public.enhanced_follow_ups(tenant_id);
create index if not exists idx_efu_lead_id on public.enhanced_follow_ups(lead_id);
create index if not exists idx_efu_due_date on public.enhanced_follow_ups(due_date);
create index if not exists idx_efu_tenant_priority_due on public.enhanced_follow_ups(tenant_id, priority, due_date);

-- 4) RLS Policies (tenant-basiert)
alter table public.enhanced_follow_ups enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='enhanced_follow_ups' and policyname='efu_select'
  ) then
    create policy efu_select on public.enhanced_follow_ups
      for select using (
        exists (
          select 1 from public.memberships m
          where m.user_id = auth.uid() and m.tenant_id = enhanced_follow_ups.tenant_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where tablename='enhanced_follow_ups' and policyname='efu_insert'
  ) then
    create policy efu_insert on public.enhanced_follow_ups
      for insert with check (
        exists (
          select 1 from public.memberships m
          where m.user_id = auth.uid() and m.tenant_id = enhanced_follow_ups.tenant_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where tablename='enhanced_follow_ups' and policyname='efu_update'
  ) then
    create policy efu_update on public.enhanced_follow_ups
      for update using (
        exists (
          select 1 from public.memberships m
          where m.user_id = auth.uid() and m.tenant_id = enhanced_follow_ups.tenant_id
        )
      ) with check (
        exists (
          select 1 from public.memberships m
          where m.user_id = auth.uid() and m.tenant_id = enhanced_follow_ups.tenant_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where tablename='enhanced_follow_ups' and policyname='efu_delete'
  ) then
    create policy efu_delete on public.enhanced_follow_ups
      for delete using (
        exists (
          select 1 from public.memberships m
          where m.user_id = auth.uid() and m.tenant_id = enhanced_follow_ups.tenant_id
        )
      );
  end if;
end $$;


