-- Optimierte, transaktionssichere Einladung-Annahme
-- Ruft man als RPC: select accept_invitations_for_current_user();

create or replace function public.accept_invitations_for_current_user()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email   text;
  v_cnt     integer := 0;
  col_accepted_at boolean;
  col_accepted_by boolean;
begin
  if v_user_id is null then
    return 0;
  end if;

  -- E-Mail bevorzugt aus JWT, andernfalls aus auth.users
  begin
    v_email := (current_setting('request.jwt.claims', true)::jsonb)->>'email';
  exception when others then
    v_email := null;
  end;
  if v_email is null then
    select email into v_email from auth.users where id = v_user_id;
  end if;
  if v_email is null then
    return 0;
  end if;

  perform 1 from public.memberships where user_id = v_user_id; -- ensure visibility

  -- Atomare Verarbeitung
  perform pg_advisory_xact_lock(hashtext('accept_invites_'||v_user_id::text));

  with ins as (
    insert into public.memberships(user_id, tenant_id, role)
    select v_user_id, i.tenant_id, i.role
    from public.invitations i
    where lower(i.email) = lower(v_email)
      and not exists (
        select 1 from public.memberships m
        where m.user_id = v_user_id and m.tenant_id = i.tenant_id
      )
    returning 1
  )
  select count(*) into v_cnt from ins;

  -- Optional: invitations.accepted_at / accepted_by setzen, wenn Spalten existieren
  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='invitations' and column_name='accepted_at'
  ),
  exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='invitations' and column_name='accepted_by'
  )
  into col_accepted_at, col_accepted_by;

  if col_accepted_at then
    if col_accepted_by then
      update public.invitations set accepted_at = now(), accepted_by = v_user_id
      where lower(email) = lower(v_email) and accepted_at is null;
    else
      update public.invitations set accepted_at = now()
      where lower(email) = lower(v_email) and accepted_at is null;
    end if;
  end if;

  return v_cnt;
end;
$$;

grant execute on function public.accept_invitations_for_current_user() to authenticated;


