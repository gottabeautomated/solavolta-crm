# Multi‑Tenant Setup und Einladungs-Workflow

Dieses Dokument beschreibt die umgesetzte Multi‑Tenant‑Architektur (DB, RLS, Storage), die Frontend‑Integration sowie den n8n‑Einladungs‑Workflow.

## Zielbild
- Mandanten (Tenants) kapseln Daten (Leads, Termine, Status, Benachrichtigungen, Dateien)
- Nutzer sehen nur Daten der Tenants, in denen sie Mitglied sind
- Admin/Owner können Nutzer per E‑Mail einladen; Einladungen werden nach Login automatisch angenommen

---

## 1) Datenbank: Tenants & Memberships

### Tabellen
```sql
create extension if not exists pgcrypto;

do $$ begin
  if not exists (select 1 from pg_type where typname='tenant_status') then
    create type tenant_status as enum ('active','inactive');
  end if;
end $$;

create table if not exists public.tenants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  domain     text unique,
  status     tenant_status not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id)     on delete cascade,
  role       text not null default 'agent' check (role in ('owner','admin','agent','viewer')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index if not exists idx_memberships_tenant_id on public.memberships(tenant_id);
create index if not exists idx_memberships_user_id   on public.memberships(user_id);
```

### RLS
```sql
alter table public.memberships enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='memberships' and policyname='memberships_select') then
    create policy memberships_select on public.memberships
      for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='memberships' and policyname='memberships_insert') then
    create policy memberships_insert on public.memberships
      for insert with check (user_id = auth.uid());
  end if;
end $$;

alter table public.tenants enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='tenants' and policyname='tenants_select_on_membership') then
    create policy tenants_select_on_membership on public.tenants
      for select using (
        exists (select 1 from public.memberships m where m.tenant_id = tenants.id and m.user_id = auth.uid())
      );
  end if;
end $$;
```

---

## 2) tenant_id in Fach-Tabellen
Felder ergänzt in: `leads`, `appointments`, `status_changes`, `notifications` (+ Indizes + FKs).

Beispiel `leads`:
```sql
alter table public.leads add column if not exists tenant_id uuid;
update public.leads set tenant_id = (select id from public.tenants where name='Default Tenant' limit 1) where tenant_id is null;
alter table public.leads alter column tenant_id set not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='leads_tenant_id_fkey') then
    alter table public.leads add constraint leads_tenant_id_fkey foreign key (tenant_id)
      references public.tenants(id) on update cascade on delete restrict;
  end if;
end $$;

create index if not exists idx_leads_tenant_id on public.leads(tenant_id);
```

RLS‑Prinzip (Beispiel `leads`):
```sql
alter table public.leads enable row level security;
create policy if not exists leads_select on public.leads
  for select using (
    exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = leads.tenant_id)
  );
create policy if not exists leads_insert on public.leads
  for insert with check (
    exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = leads.tenant_id)
  );
create policy if not exists leads_update on public.leads
  for update using (
    exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = leads.tenant_id)
  ) with check (
    exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = leads.tenant_id)
  );
create policy if not exists leads_delete on public.leads
  for delete using (
    exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = leads.tenant_id)
  );
```

---

## 3) Storage‑Policies (Supabase Storage)
Pfad: `tenant/<tenant_id>/user/<user_id>/leads/<lead_id>/<type>/<timestamp>_file.pdf`

Beispiel (Bucket `offers`; analog `tvp`):
```sql
create policy if not exists storage_offers_select on storage.objects
  for select to authenticated using (
    bucket_id = 'offers' and exists (
      select 1 from public.memberships m where m.user_id = auth.uid() and m.tenant_id = (split_part(name,'/',2))::uuid
    )
  );
-- analog: insert/update/delete
```

---

## 4) Frontend‑Integration
- `AuthContext` lädt Memberships (`memberships` → `tenants`), stellt `tenants`, `activeTenantId`, `setActiveTenantId` bereit; Auto‑Select + Persistenz in `localStorage`.
- `ProtectedRoute` zeigt Loader (max. 2s), dann ggf. Fallback „Kein Mandant zugeordnet“.
- `useLeads` setzt `tenant_id` bei Inserts.
- `storage.ts` nutzt tenantisierten Upload‑Pfad.
- `useNotifications` filtert per `tenant_id`.
- `Layout` enthält Tenant‑Switcher und (rollenbasiert) den Invite‑Button.

---

## 5) Einladungen (Invitations)

### Tabelle & RLS
```sql
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role  text not null check (role in ('owner','admin','agent','viewer')) default 'agent',
  token text not null unique,
  invited_by uuid not null references auth.users(id) on delete restrict,
  accepted boolean not null default false,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create index if not exists idx_invitations_tenant_email on public.invitations(tenant_id, email);

alter table public.invitations enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='invitations' and policyname='invitations_select') then
    create policy invitations_select on public.invitations
      for select using (
        exists (
          select 1 from public.memberships m
          where m.tenant_id = invitations.tenant_id and m.user_id = auth.uid() and m.role in ('owner','admin')
        )
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='invitations' and policyname='invitations_insert') then
    create policy invitations_insert on public.invitations
      for insert with check (
        exists (
          select 1 from public.memberships m
          where m.tenant_id = invitations.tenant_id and m.user_id = auth.uid() and m.role in ('owner','admin')
        )
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='invitations' and policyname='invitations_update') then
    create policy invitations_update on public.invitations
      for update using (
        exists (
          select 1 from public.memberships m
          where m.tenant_id = invitations.tenant_id and m.user_id = auth.uid() and m.role in ('owner','admin')
        )
      );
  end if;
end $$;
```

### RPC: Einladungen nach Login annehmen
```sql
create or replace function public.accept_invitations_for_current_user()
returns void language plpgsql security definer as $$
declare v_user_id uuid; v_email text; begin
  v_user_id := auth.uid();
  select email into v_email from auth.users where id = v_user_id;

  insert into public.memberships (tenant_id, user_id, role)
  select i.tenant_id, v_user_id, i.role
  from public.invitations i
  where i.email ilike v_email and i.accepted = false
  on conflict (tenant_id, user_id) do update set role = excluded.role;

  update public.invitations set accepted = true, accepted_at = now()
  where email ilike v_email and accepted = false;
end; $$;
```

### Frontend
- Invite‑UI in `Layout`: E‑Mail + Rolle; Insert in `public.invitations` (mit `token` als `crypto.randomUUID()`).
- Nach Login: `await supabase.rpc('accept_invitations_for_current_user')`.
- Invite‑Button sichtbar nur für `owner|admin` (rollenbasiert + RLS im Backend).

---

## 6) n8n‑Workflow (E‑Mail Einladung)
- Webhook `create-invitation` (POST): Body `{ tenant_id, email, role, token, invited_by, tenant_name }`
- Aktion: E‑Mail an `email` mit Link `https://<app-domain>/login?invite={{$json.token}}`
- Optional: Cron‑Reminder für nicht angenommene Einladungen

---

## 7) Vercel/Build Fixes (Kurz)
- `vercel.json` → Static Build via `package.json`
- TS‑Fixes (unused React, Badge props, Notifications.read)

---

## 8) Troubleshooting
- Endloser Loader → Browser‑State leeren (`localStorage`, `sessionStorage`, Cache, Service Worker) und `activeTenantId` setzen
- RLS‑Fehler → Policies auf `memberships`/`tenants` prüfen

---

## 9) Admin‑SQL (Beispiele)
```sql
-- Tenant umbenennen
update public.tenants set name='Jonibär' where id='e2c70ce4-9e09-43cb-8278-145839524536';

-- Membership prüfen
select m.tenant_id, m.role, t.name from public.memberships m join public.tenants t on t.id=m.tenant_id
where m.user_id=(select id from auth.users where email ilike 'jonas.behrmann@googlemail.com' limit 1);

-- Rolle ändern
update public.memberships set role='owner'
where user_id=(select id from auth.users where email ilike 'jonas.behrmann@googlemail.com' limit 1)
  and tenant_id='e2c70ce4-9e09-43cb-8278-145839524536';
```

---

## 10) Optionen / Nächste Schritte
- Branding je Tenant (`branding_json`) und UI‑Theming
- Admin‑Seite: Einladungen verwalten (Resend/Revoke)
- Domains/Subdomains pro Tenant (Vercel Wildcard)
- Edge Function: Automatisches Accept bei `auth.user_created`