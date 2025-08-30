-- Add SAP integration helper fields to leads

alter table if exists public.leads
  add column if not exists sap_id text,
  add column if not exists source text default 'manual',
  add column if not exists assigned_by_sap text,
  add column if not exists imported_at timestamptz default now(),
  add column if not exists sap_raw jsonb;

-- Unique index for upsert by sap_id (nullable allowed)
create unique index if not exists idx_leads_sap_id
  on public.leads (sap_id)
  where sap_id is not null;


