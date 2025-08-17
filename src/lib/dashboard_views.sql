-- Dashboard Views (tenant-aware via memberships + auth.uid())
-- Keine Parameter nötig; im Client per eq('tenant_id', activeTenantId) filtern

create or replace view public.v_today_tasks as
with today as (
  select date_trunc('day', now()) as start_ts,
         date_trunc('day', now()) + interval '1 day' - interval '1 ms' as end_ts
)
select efu.id as task_id,
       'efu'::text as source,
       efu.lead_id,
       efu.tenant_id,
       efu.type::text as title,
       (t.start_ts + (efu.due_date - date_trunc('day', now())))::timestamptz as due_at,
       efu.priority::text as priority,
       efu.notes
from public.enhanced_follow_ups efu
cross join today t
where efu.completed_at is null
  and efu.due_date = current_date
  and exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.tenant_id = efu.tenant_id
  )
  and (
    exists (
      select 1 from public.memberships m
      where m.user_id = auth.uid() and m.tenant_id = efu.tenant_id and m.role in ('owner','admin','sales_admin')
    )
    or exists (
      select 1 from public.leads l
      where l.id = efu.lead_id and l.tenant_id = efu.tenant_id and l.user_id = auth.uid()
    )
  )
union all
select a.id as task_id,
       'appointment'::text as source,
       a.lead_id,
       a.tenant_id,
       coalesce(a.status, 'scheduled') as title,
       a.starts_at as due_at,
       'medium'::text as priority,
       coalesce(a.notes,'') as notes
from public.appointments a
cross join today t
where a.starts_at >= t.start_ts and a.starts_at <= t.end_ts
  and exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.tenant_id = a.tenant_id
  )
  and (
    exists (
      select 1 from public.memberships m
      where m.user_id = auth.uid() and m.tenant_id = a.tenant_id and m.role in ('owner','admin','sales_admin')
    )
    or exists (
      select 1 from public.leads l
      where l.id = a.lead_id and l.tenant_id = a.tenant_id and l.user_id = auth.uid()
    )
  );

create or replace view public.v_overdue_tasks as
with today as (select date_trunc('day', now()) as start_ts)
select efu.id as task_id,
       'efu'::text as source,
       efu.lead_id,
       efu.tenant_id,
       efu.type::text as title,
       (t.start_ts + (efu.due_date - date_trunc('day', now())))::timestamptz as due_at,
       efu.priority::text as priority,
       efu.notes
from public.enhanced_follow_ups efu
cross join today t
where efu.completed_at is null
  and efu.due_date < current_date
  and exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.tenant_id = efu.tenant_id
  )
  and (
    exists (
      select 1 from public.memberships m
      where m.user_id = auth.uid() and m.tenant_id = efu.tenant_id and m.role in ('owner','admin','sales_admin')
    )
    or exists (
      select 1 from public.leads l
      where l.id = efu.lead_id and l.tenant_id = efu.tenant_id and l.user_id = auth.uid()
    )
  )
union all
select a.id as task_id,
       'appointment'::text as source,
       a.lead_id,
       a.tenant_id,
       coalesce(a.status,'scheduled') as title,
       a.starts_at as due_at,
       'medium'::text as priority,
       coalesce(a.notes,'') as notes
from public.appointments a
where a.starts_at < now()
  and coalesce(a.status,'scheduled') <> 'completed'
  and exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.tenant_id = a.tenant_id
  )
  and (
    exists (
      select 1 from public.memberships m
      where m.user_id = auth.uid() and m.tenant_id = a.tenant_id and m.role in ('owner','admin','sales_admin')
    )
    or exists (
      select 1 from public.leads l
      where l.id = a.lead_id and l.tenant_id = a.tenant_id and l.user_id = auth.uid()
    )
  );

create or replace view public.v_week_overview as
with bounds as (
  select date_trunc('week', now())::date as start_d,
         (date_trunc('week', now()) + interval '6 days')::date as end_d
), days as (
  select generate_series((select start_d from bounds), (select end_d from bounds), interval '1 day')::date as d
)
select m.tenant_id,
       d.d as day_date,
       coalesce((
         select count(*) from public.enhanced_follow_ups efu
         join public.leads l on l.id = efu.lead_id and l.tenant_id = efu.tenant_id
         where efu.tenant_id = m.tenant_id and efu.completed_at is null and efu.due_date = d.d
           and (
             m.role in ('owner','admin','sales_admin')
             or l.user_id = auth.uid()
           )
       ),0)::int as efu_count,
       coalesce((
         select count(*) from public.appointments a
         join public.leads l on l.id = a.lead_id and l.tenant_id = a.tenant_id
         where a.tenant_id = m.tenant_id and a.starts_at::date = d.d
           and (
             m.role in ('owner','admin','sales_admin')
             or l.user_id = auth.uid()
           )
       ),0)::int as appointment_count
from public.memberships m
join days d on true
where m.user_id = auth.uid();

create or replace view public.v_lead_priorities as
select l.tenant_id,
       l.id as lead_id,
       coalesce(l.name,'') as name,
       l.phone,
       l.email,
       max(efu.priority::text) filter (where efu.completed_at is null) as top_priority,
       min(efu.due_date) filter (where efu.completed_at is null) as next_due
from public.leads l
left join public.enhanced_follow_ups efu on efu.lead_id = l.id and efu.tenant_id = l.tenant_id
where exists (
  select 1 from public.memberships m
  where m.user_id = auth.uid() and m.tenant_id = l.tenant_id
)
and exists (
  select 1 from public.memberships m2
  where m2.user_id = auth.uid() and m2.tenant_id = l.tenant_id and (
    m2.role in ('owner','admin','sales_admin') or l.user_id = auth.uid()
  )
)
group by l.tenant_id, l.id, l.name, l.phone, l.email;


