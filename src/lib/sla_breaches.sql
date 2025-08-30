-- SLA Breaches view for alerts
create or replace view public.v_sla_breaches as
with my_tenants as (
  select m.tenant_id from public.memberships m where m.user_id = auth.uid()
),
limits as (
  select now() as now_ts, (now() - interval '24 hours') as lim_24h, (now() - interval '48 hours') as lim_48h
)
-- contact within 24h missing
select l.tenant_id, 'contact_24h'::text as breach_type, l.id as lead_id,
  coalesce(nullif(l.name,''), nullif(l.email,''), nullif(l.phone,'')) as lead_name,
  l.created_at as due_at, 1 as level
from public.leads l, limits lim
where l.tenant_id in (select tenant_id from my_tenants)
  and l.created_at <= lim.lim_24h
  and coalesce(l.phone_status,'') <> 'erreicht'
  and not exists (
    select 1 from public.status_changes s
    where s.lead_id = l.id and s.changed_at <= l.created_at + interval '24 hours'
  )
union all
-- offer within 48h after appointment
select l.tenant_id, 'offer_48h'::text as breach_type, l.id as lead_id,
  coalesce(nullif(l.name,''), nullif(l.email,''), nullif(l.phone,'')) as lead_name,
  a.starts_at as due_at, 1 as level
from public.appointments a
join public.leads l on l.id = a.lead_id
join limits lim on true
where l.tenant_id in (select tenant_id from my_tenants)
  and a.starts_at <= lim.lim_48h
  and not exists (
    select 1 from regexp_matches(coalesce(l.documentation,''), '"gross"\s*:\s*([0-9\.]+)', 'g') m
    where a.starts_at + interval '48 hours' >= a.starts_at
  )
union all
-- overdue follow-ups
select f.tenant_id, 'followup_overdue'::text as breach_type, f.lead_id,
  coalesce(nullif(l.name,''), nullif(l.email,''), nullif(l.phone,'')) as lead_name,
  (f.due_date::timestamptz) as due_at, 1 as level
from public.enhanced_follow_ups f, limits lim
join public.leads l on l.id = f.lead_id
where f.tenant_id in (select tenant_id from my_tenants)
  and f.completed_at is null and f.due_date < lim.now_ts::date;

grant select on public.v_sla_breaches to authenticated;


