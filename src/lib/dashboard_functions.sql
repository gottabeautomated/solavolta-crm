-- Dashboard helper functions (mobile-first), tenant-aware
-- Execute in Supabase SQL editor (schema public)

create extension if not exists pgcrypto;

-- 1) Heute: Follow-ups + Termine
create or replace function public.get_today_tasks(p_tenant_id uuid, p_limit int default 50)
returns table (
  task_id uuid,
  source text,
  lead_id uuid,
  tenant_id uuid,
  title text,
  due_at timestamptz,
  priority text,
  notes text
) language sql security definer set search_path = public as $$
  with guard as (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.tenant_id = p_tenant_id
  ),
  today as (
    select date_trunc('day', now()) as start_ts,
           date_trunc('day', now()) + interval '1 day' - interval '1 ms' as end_ts
  )
  (
    -- Enhanced follow ups due today (not completed)
    select
      efu.id as task_id,
      'efu'::text as source,
      efu.lead_id,
      efu.tenant_id,
      efu.type::text as title,
      (t.start_ts + (efu.due_date - date_trunc('day', now())) )::timestamptz as due_at,
      efu.priority::text as priority,
      efu.notes
    from public.enhanced_follow_ups efu
    cross join today t
    where efu.tenant_id = p_tenant_id
      and efu.completed_at is null
      and efu.due_date = current_date
      and exists(select 1 from guard)
  )
  union all
  (
    -- Appointments starting today
    select
      a.id as task_id,
      'appointment'::text as source,
      a.lead_id,
      a.tenant_id,
      coalesce(a.status,'scheduled') as title,
      a.starts_at as due_at,
      'medium'::text as priority,
      coalesce(a.notes,'') as notes
    from public.appointments a
    cross join today t
    where a.tenant_id = p_tenant_id
      and a.starts_at >= t.start_ts and a.starts_at <= t.end_ts
      and exists(select 1 from guard)
  )
  order by due_at asc
  limit greatest(1, p_limit);
$$;

-- 2) Überfällige Aktionen
create or replace function public.get_overdue_tasks(p_tenant_id uuid, p_limit int default 50)
returns table (
  task_id uuid,
  source text,
  lead_id uuid,
  tenant_id uuid,
  title text,
  due_at timestamptz,
  priority text,
  notes text
) language sql security definer set search_path = public as $$
  with guard as (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.tenant_id = p_tenant_id
  ),
  today as (
    select date_trunc('day', now()) as start_ts
  )
  (
    select
      efu.id as task_id,
      'efu'::text as source,
      efu.lead_id,
      efu.tenant_id,
      efu.type::text as title,
      (t.start_ts + (efu.due_date - date_trunc('day', now())))::timestamptz as due_at,
      efu.priority::text as priority,
      efu.notes
    from public.enhanced_follow_ups efu
    cross join today t
    where efu.tenant_id = p_tenant_id
      and efu.completed_at is null
      and efu.due_date < current_date
      and exists(select 1 from guard)
  )
  union all
  (
    select
      a.id as task_id,
      'appointment'::text as source,
      a.lead_id,
      a.tenant_id,
      coalesce(a.status,'scheduled') as title,
      a.starts_at as due_at,
      'medium'::text as priority,
      coalesce(a.notes,'') as notes
    from public.appointments a
    where a.tenant_id = p_tenant_id
      and a.starts_at < now()
      and coalesce(a.status,'scheduled') <> 'completed'
      and exists(select 1 from guard)
  )
  order by due_at asc
  limit greatest(1, p_limit);
$$;

-- 3) Wochen-Übersicht (Counts je Tag)
create or replace function public.get_week_overview(p_tenant_id uuid)
returns table (
  day_date date,
  efu_count int,
  appointment_count int
) language sql security definer set search_path = public as $$
  with guard as (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.tenant_id = p_tenant_id
  ), bounds as (
    select date_trunc('week', now())::date as start_d,
           (date_trunc('week', now()) + interval '6 days')::date as end_d
  ), days as (
    select generate_series((select start_d from bounds), (select end_d from bounds), interval '1 day')::date as d
  )
  select
    d.d as day_date,
    coalesce((
      select count(*) from public.enhanced_follow_ups efu
      where efu.tenant_id = p_tenant_id and efu.completed_at is null and efu.due_date = d.d
      and exists(select 1 from guard)
    ),0)::int as efu_count,
    coalesce((
      select count(*) from public.appointments a
      where a.tenant_id = p_tenant_id and a.starts_at::date = d.d
      and exists(select 1 from guard)
    ),0)::int as appointment_count
  from days d
  order by d.d asc;
$$;

-- 4) Priorisierte Lead-Liste
create or replace function public.get_lead_priorities(p_tenant_id uuid, p_limit int default 50)
returns table (
  lead_id uuid,
  tenant_id uuid,
  name text,
  phone text,
  email text,
  top_priority text,
  next_due date
) language sql security definer set search_path = public as $$
  with guard as (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.tenant_id = p_tenant_id
  ), scored as (
    select
      l.id as lead_id,
      l.tenant_id,
      l.name,
      l.phone,
      l.email,
      min(efu.due_date) filter (where efu.completed_at is null) as next_due,
      max(
        case efu.priority
          when 'overdue' then 4
          when 'high' then 3
          when 'medium' then 2
          when 'low' then 1
          else 0
        end
      ) as prio_score,
      max(efu.priority::text) filter (where efu.completed_at is null) as top_priority
    from public.leads l
    left join public.enhanced_follow_ups efu on efu.lead_id = l.id and efu.tenant_id = l.tenant_id
    where l.tenant_id = p_tenant_id
    group by l.id, l.tenant_id, l.name, l.phone, l.email
  )
  select lead_id, tenant_id, coalesce(name,'') as name, phone, email,
         coalesce(top_priority, 'low') as top_priority,
         next_due
  from scored
  where exists(select 1 from guard)
  order by prio_score desc nulls last, next_due asc nulls last
  limit greatest(1, p_limit);
$$;


