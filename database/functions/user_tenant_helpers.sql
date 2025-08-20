-- Helper: get_user_tenants() – performante Tenantliste für current_user

create or replace function public.get_user_tenants()
returns table (tenant_id uuid, name text, role text)
language sql
stable
security definer
set search_path = public
as $$
  select m.tenant_id, t.name, m.role
  from public.memberships m
  join public.tenants t on t.id = m.tenant_id
  where m.user_id = auth.uid()
  order by t.name;
$$;

grant execute on function public.get_user_tenants() to authenticated;

-- Helper: switch_active_tenant(tenant_id) – validiert Mitgliedschaft

create or replace function public.switch_active_tenant(p_tenant_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = p_tenant_id
  ) then
    raise exception 'User is not member of tenant %', p_tenant_id using errcode = '42501';
  end if;
  -- Client-seitig wird activeTenantId in localStorage gepflegt; Server kann hier optional Auditing betreiben
  return true;
end;
$$;

grant execute on function public.switch_active_tenant(uuid) to authenticated;

-- KPIs für Dashboard – einfache, performante Kennzahlen

create or replace function public.get_tenant_stats(p_tenant_id uuid)
returns table (
  leads_today int,
  leads_week int,
  fu_due_today int,
  fu_overdue int,
  appt_today int
)
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select current_date as d0, (date_trunc('week', now())::date) as w0, (date_trunc('week', now())::date + 6) as w1
  )
  select
    (select count(*) from public.leads l where l.tenant_id = p_tenant_id and l.created_at::date = (select d0 from bounds)
      and (public.is_tenant_admin(p_tenant_id) or l.user_id = auth.uid()))::int as leads_today,
    (select count(*) from public.leads l where l.tenant_id = p_tenant_id and l.created_at::date between (select w0 from bounds) and (select w1 from bounds)
      and (public.is_tenant_admin(p_tenant_id) or l.user_id = auth.uid()))::int as leads_week,
    (select count(*) from public.enhanced_follow_ups e join public.leads l on l.id=e.lead_id and l.tenant_id=e.tenant_id
      where e.tenant_id = p_tenant_id and e.completed_at is null and e.due_date = current_date
      and (public.is_tenant_admin(p_tenant_id) or l.user_id = auth.uid()))::int as fu_due_today,
    (select count(*) from public.enhanced_follow_ups e join public.leads l on l.id=e.lead_id and l.tenant_id=e.tenant_id
      where e.tenant_id = p_tenant_id and e.completed_at is null and e.due_date < current_date
      and (public.is_tenant_admin(p_tenant_id) or l.user_id = auth.uid()))::int as fu_overdue,
    (select count(*) from public.appointments a join public.leads l on l.id=a.lead_id and l.tenant_id=a.tenant_id
      where a.tenant_id = p_tenant_id and a.starts_at::date = current_date
      and (public.is_tenant_admin(p_tenant_id) or l.user_id = auth.uid()))::int as appt_today
  ;
$$;

grant execute on function public.get_tenant_stats(uuid) to authenticated;


