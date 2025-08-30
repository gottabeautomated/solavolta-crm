-- Wrapper-Funktionen für PostgREST (ohne Default-Parameter, stable)

-- Heute
create or replace function public.rpc_get_today_tasks(p_tenant_id uuid, p_limit integer)
returns table (
  task_id uuid,
  source text,
  lead_id uuid,
  tenant_id uuid,
  title text,
  due_at timestamptz,
  priority text,
  notes text
) language sql stable security definer set search_path = public as $$
  select * from public.get_today_tasks(p_tenant_id, p_limit);
$$;

-- Überfällig
create or replace function public.rpc_get_overdue_tasks(p_tenant_id uuid, p_limit integer)
returns table (
  task_id uuid,
  source text,
  lead_id uuid,
  tenant_id uuid,
  title text,
  due_at timestamptz,
  priority text,
  notes text
) language sql stable security definer set search_path = public as $$
  select * from public.get_overdue_tasks(p_tenant_id, p_limit);
$$;

-- Woche
create or replace function public.rpc_get_week_overview(p_tenant_id uuid)
returns table (
  day_date date,
  efu_count int,
  appointment_count int
) language sql stable security definer set search_path = public as $$
  select * from public.get_week_overview(p_tenant_id);
$$;

-- Prioritäten
create or replace function public.rpc_get_lead_priorities(p_tenant_id uuid, p_limit integer)
returns table (
  lead_id uuid,
  tenant_id uuid,
  name text,
  phone text,
  email text,
  top_priority text,
  next_due date
) language sql stable security definer set search_path = public as $$
  select * from public.get_lead_priorities(p_tenant_id, p_limit);
$$;

-- Rechte
grant execute on function public.rpc_get_today_tasks(uuid, integer)      to authenticated, anon;
grant execute on function public.rpc_get_overdue_tasks(uuid, integer)    to authenticated, anon;
grant execute on function public.rpc_get_week_overview(uuid)             to authenticated, anon;
grant execute on function public.rpc_get_lead_priorities(uuid, integer)  to authenticated, anon;


