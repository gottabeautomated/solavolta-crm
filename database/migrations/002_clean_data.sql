-- 002_clean_data.sql
-- Ziel: Datenbereinigung und Validierung. Ohne Datenverlust; destruktive Schritte sind bewusst NICHT enthalten.

begin;

-- 1) Integrität: Leere/ungültige tenant_id in Domain-Tabellen aufräumen
-- Hinweis: Wir korrigieren NICHT automatisch, sondern markieren für spätere manuelle Korrektur.

-- Leads ohne tenant_id in eine Prüftabelle schreiben
create table if not exists public._integrity_issues (
  id bigserial primary key,
  issue_type text not null,
  ref_table text not null,
  ref_id uuid not null,
  details jsonb,
  created_at timestamptz not null default now()
);

insert into public._integrity_issues(issue_type, ref_table, ref_id, details)
select 'missing_tenant_id', 'leads', l.id, jsonb_build_object('user_id', l.user_id)
from public.leads l
where l.tenant_id is null
on conflict do nothing;

-- Appointments ohne tenant_id
insert into public._integrity_issues(issue_type, ref_table, ref_id, details)
select 'missing_tenant_id', 'appointments', a.id, jsonb_build_object('lead_id', a.lead_id)
from public.appointments a
where a.tenant_id is null
on conflict do nothing;

-- EFUs ohne tenant_id
insert into public._integrity_issues(issue_type, ref_table, ref_id, details)
select 'missing_tenant_id', 'enhanced_follow_ups', e.id, jsonb_build_object('lead_id', e.lead_id)
from public.enhanced_follow_ups e
where e.tenant_id is null
on conflict do nothing;

-- 2) Duplikate in memberships (user_id, tenant_id) entfernen (nur Mehrfacheinträge)
with cte as (
  select user_id, tenant_id, row_number() over (partition by user_id, tenant_id order by created_at) as rn
  from public.memberships
)
delete from public.memberships m
using cte
where m.user_id = cte.user_id and m.tenant_id = cte.tenant_id and cte.rn > 1;

-- 3) Invalide Referenzen protokollieren
insert into public._integrity_issues(issue_type, ref_table, ref_id, details)
select 'invalid_fk', 'appointments', a.id, jsonb_build_object('lead_id', a.lead_id)
from public.appointments a
left join public.leads l on l.id = a.lead_id
where l.id is null
on conflict do nothing;

insert into public._integrity_issues(issue_type, ref_table, ref_id, details)
select 'invalid_fk', 'enhanced_follow_ups', e.id, jsonb_build_object('lead_id', e.lead_id)
from public.enhanced_follow_ups e
left join public.leads l on l.id = e.lead_id
where l.id is null
on conflict do nothing;

-- 4) NOT VALID FKs validieren, wenn keine Issues mehr offen (optional, idempotent)
-- Achtung: Validierung schlägt fehl, wenn oben Issues protokolliert wurden.
do $$
declare v_cnt int;
begin
  select count(*) into v_cnt from public._integrity_issues where issue_type in ('missing_tenant_id','invalid_fk');
  if v_cnt = 0 then
    begin
      alter table if exists public.leads validate constraint fk_leads_tenant;
    exception when others then null; end;
    begin
      alter table if exists public.leads validate constraint fk_leads_user;
    exception when others then null; end;
    begin
      alter table if exists public.appointments validate constraint fk_appt_tenant;
    exception when others then null; end;
    begin
      alter table if exists public.appointments validate constraint fk_appt_lead;
    exception when others then null; end;
    begin
      alter table if exists public.enhanced_follow_ups validate constraint fk_efu_tenant;
    exception when others then null; end;
    begin
      alter table if exists public.enhanced_follow_ups validate constraint fk_efu_lead;
    exception when others then null; end;
    begin
      alter table if exists public.notifications validate constraint fk_notifications_tenant;
    exception when others then null; end;
    begin
      alter table if exists public.notifications validate constraint fk_notifications_user;
    exception when others then null; end;
    begin
      alter table if exists public.saved_views validate constraint fk_saved_views_tenant;
    exception when others then null; end;
    begin
      alter table if exists public.saved_views validate constraint fk_saved_views_user;
    exception when others then null; end;
    begin
      alter table if exists public.memberships validate constraint fk_memberships_tenant;
    exception when others then null; end;
    begin
      alter table if exists public.memberships validate constraint fk_memberships_user;
    exception when others then null; end;
  end if;
end $$;

commit;

-- Hinweis: Die "Bereinigung korrupter activeTenantId in localStorage" kann nicht serverseitig per SQL erfolgen.
-- Sie ist bereits clientseitig implementiert (SimpleAuthContext + useAppStartup). Für produktive Nutzer
-- kann über ein kleines Admin-Tool ein localStorage-Reset angestoßen werden, falls erforderlich.


