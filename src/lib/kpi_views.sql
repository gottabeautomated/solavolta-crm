-- KPI Views (tenant-aware via memberships + auth.uid())
-- Execute in Supabase SQL Editor (public schema)

-- 1) KPIs heute / Woche / Termine / Follow-ups
create or replace view public.v_kpis_today as
with my_tenants as (
  select m.tenant_id from public.memberships m where m.user_id = auth.uid()
),
limits as (
  select date_trunc('day', now())::date as today,
         (date_trunc('week', now())::date) as week_start
)
select t.tenant_id,
  -- Leads heute / Woche
  (select count(*) from public.leads l, limits lim
   where l.tenant_id = t.tenant_id and l.created_at::date = lim.today) as leads_today,
  (select count(*) from public.leads l, limits lim
   where l.tenant_id = t.tenant_id and l.created_at::date between lim.week_start and lim.today) as leads_week,
  -- Follow-ups fällig heute / überfällig
  (select count(*) from public.enhanced_follow_ups f, limits lim
   where f.tenant_id = t.tenant_id and f.completed_at is null and f.due_date = lim.today) as fu_due_today,
  (select count(*) from public.enhanced_follow_ups f, limits lim
   where f.tenant_id = t.tenant_id and f.completed_at is null and f.due_date < lim.today) as fu_overdue,
  -- Termine heute
  (select count(*) from public.appointments a, limits lim
   where a.tenant_id = t.tenant_id and a.starts_at::date = lim.today) as appt_today
from my_tenants t;


-- 2) Conversion Rates entlang Pipeline (vereinfachtes Modell)
-- Kontakt: phone_status = 'erreicht'
-- Angebot: offer_pv = true
-- Termin: appointments vorhanden
-- Gewonnen: lead_status = 'Gewonnen'
create or replace view public.v_conversion_rates as
with my_tenants as (
  select m.tenant_id from public.memberships m where m.user_id = auth.uid()
)
select t.tenant_id,
  l_total,
  l_contacted,
  l_offered,
  l_appointed,
  l_won,
  case when l_total > 0 then round(l_contacted::numeric / l_total * 100, 1) else 0 end as rate_contacted,
  case when l_contacted > 0 then round(l_offered::numeric / l_contacted * 100, 1) else 0 end as rate_offered,
  case when l_offered > 0 then round(l_appointed::numeric / l_offered * 100, 1) else 0 end as rate_appointed,
  case when l_appointed > 0 then round(l_won::numeric / l_appointed * 100, 1) else 0 end as rate_won
from (
  select t.tenant_id,
    (select count(*) from public.leads l where l.tenant_id = t.tenant_id) as l_total,
    (select count(*) from public.leads l where l.tenant_id = t.tenant_id and l.phone_status = 'erreicht') as l_contacted,
    (select count(*) from public.leads l where l.tenant_id = t.tenant_id and l.offer_pv = true) as l_offered,
    (select count(distinct a.lead_id) from public.appointments a where a.tenant_id = t.tenant_id) as l_appointed,
    (select count(*) from public.leads l where l.tenant_id = t.tenant_id and l.lead_status = 'Gewonnen') as l_won
  from my_tenants t
) s join my_tenants t on t.tenant_id = s.tenant_id;


-- 3) SLA-Tracking (24h Erstkontakt, 48h Angebotsversand)
-- Annahmen:
--  - Erstkontakt: erster status_changes-Eintrag des Leads innerhalb 24h ODER phone_status='erreicht' und updated_at innerhalb 24h
--  - Angebot: Lead-Dokumentation enthält JSON-Block "gross" (OfferWizard speichert JSON in documentation); wir werten das Vorkommen innerhalb 48h aus
create or replace view public.v_sla_tracking as
with my_tenants as (
  select m.tenant_id from public.memberships m where m.user_id = auth.uid()
),
touch as (
  select l.id as lead_id, l.tenant_id,
    exists (
      select 1 from public.status_changes s
      where s.lead_id = l.id and s.changed_at <= l.created_at + interval '24 hours'
    ) or (l.phone_status = 'erreicht' and l.updated_at <= l.created_at + interval '24 hours') as contacted_24h,
    exists (
      select 1
      from regexp_matches(coalesce(l.documentation,''), '"gross"\s*:\s*([0-9\.]+)', 'g') m
      where l.created_at + interval '48 hours' >= l.created_at
    ) as offered_48h
  from public.leads l
),
agg as (
  select t.tenant_id,
    count(*) filter (where l.tenant_id = t.tenant_id) as leads_total,
    count(*) filter (where l.tenant_id = t.tenant_id and contacted_24h) as contacted_ok,
    count(*) filter (where l.tenant_id = t.tenant_id and offered_48h) as offered_ok
  from my_tenants t
  join touch l on l.tenant_id = t.tenant_id
  group by t.tenant_id
)
select tenant_id,
  leads_total,
  contacted_ok,
  offered_ok,
  case when leads_total > 0 then round(contacted_ok::numeric / leads_total * 100,1) else 0 end as sla_contacted_pct,
  case when leads_total > 0 then round(offered_ok::numeric / leads_total * 100,1) else 0 end as sla_offered_pct,
  case when (case when leads_total > 0 then contacted_ok::numeric / leads_total * 100 else 0 end) >= 90 then 'green'
       when (case when leads_total > 0 then contacted_ok::numeric / leads_total * 100 else 0 end) >= 70 then 'yellow'
       else 'red' end as sla_contacted_color,
  case when (case when leads_total > 0 then offered_ok::numeric / leads_total * 100 else 0 end) >= 90 then 'green'
       when (case when leads_total > 0 then offered_ok::numeric / leads_total * 100 else 0 end) >= 70 then 'yellow'
       else 'red' end as sla_offered_color
from agg;


-- 4) Umsatz-Schätzung (grobe Extraktion aus Lead.documentation JSON-Blöcken)
create or replace view public.v_revenue_estimate as
with my_tenants as (
  select m.tenant_id from public.memberships m where m.user_id = auth.uid()
)
select t.tenant_id,
  coalesce(
    (select sum((regexp_match(coalesce(l.documentation,''), '"gross"\s*:\s*([0-9\.]+)'))[1]::numeric)
     from public.leads l where l.tenant_id = t.tenant_id), 0
  ) as gross_estimate
from my_tenants t;


-- Optional: Materialized Views (für größere Datenmengen). Diese einfachen REFRESHs
-- können per Edge Function/N8N periodisch ausgeführt werden.
--
-- create materialized view public.mv_kpis_today as select * from public.v_kpis_today;
-- create materialized view public.mv_conversion_rates as select * from public.v_conversion_rates;
-- create materialized view public.mv_sla_tracking as select * from public.v_sla_tracking;
-- create materialized view public.mv_revenue_estimate as select * from public.v_revenue_estimate;
--
-- refresh materialized view public.mv_kpis_today;
-- refresh materialized view public.mv_conversion_rates;
-- refresh materialized view public.mv_sla_tracking;
-- refresh materialized view public.mv_revenue_estimate;


-- Rechte
grant select on public.v_kpis_today        to authenticated;
grant select on public.v_conversion_rates  to authenticated;
grant select on public.v_sla_tracking      to authenticated;
grant select on public.v_revenue_estimate  to authenticated;


