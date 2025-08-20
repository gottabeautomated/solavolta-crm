-- Lead-Tabelle erstellen
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text,
  phone text,
  email text,
  address text,
  status_since date DEFAULT CURRENT_DATE,
  lead_status text DEFAULT 'Neu',
  contact_type text,
  phone_status text,
  appointment_date date,
  appointment_time text,
  offer_pv boolean DEFAULT false,
  offer_storage boolean DEFAULT false,
  offer_backup boolean DEFAULT false,
  tvp boolean DEFAULT false,
  documentation text,
  doc_link text,
  calendar_link text,
  follow_up boolean DEFAULT false,
  follow_up_date date,
  exported_to_sap boolean DEFAULT false,
  -- Neue Felder für Telefon-Kaskade
  voicemail_left boolean default false,
  phone_switched_off boolean default false,
  not_reached_count integer default 0,
  -- PV-Kurzinfos
  pv_kwp double precision,
  storage_kwh double precision,
  has_backup boolean default false,
  has_ev_charger boolean default false,
  has_heating_mgmt boolean default false,
  quick_notes text,
  lat double precision,
  lng double precision,
  -- Neue Felder für "Nächste Aktion"
  next_action text,
  next_action_date date,
  next_action_time text,
  preliminary_offer boolean DEFAULT false,
  -- Neues Feld für "Verloren" Grund
  lost_reason text
);

-- Updated_at Trigger erstellen (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_leads_updated_at'
  ) THEN
    CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_coordinates ON leads(lat, lng);

-- Kontaktversuche (Log)
CREATE TABLE IF NOT EXISTS public.contact_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL DEFAULT 1,
  contact_date timestamptz NOT NULL DEFAULT now(),
  reached boolean NOT NULL DEFAULT false,
  mailbox_left boolean NOT NULL DEFAULT false,
  phone_off boolean NOT NULL DEFAULT false,
  notes text,
  next_attempt_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_attempts_tenant_lead ON public.contact_attempts(tenant_id, lead_id, contact_date DESC);

-- RLS für Kontaktversuche
ALTER TABLE public.contact_attempts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename='contact_attempts' AND p.policyname='contact_attempts_select'
  ) THEN
    CREATE POLICY contact_attempts_select ON public.contact_attempts
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.user_id = auth.uid() AND m.tenant_id = contact_attempts.tenant_id
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename='contact_attempts' AND p.policyname='contact_attempts_insert'
  ) THEN
    CREATE POLICY contact_attempts_insert ON public.contact_attempts
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.user_id = auth.uid() AND m.tenant_id = contact_attempts.tenant_id
        )
      );
  END IF;
END $$;

-- Testdaten entfernt (Produktivdaten vorhanden)

-- Row Level Security aktivieren
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy für authentifizierte User (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'leads'
      AND policyname = 'Leads sind für alle authentifizierten User sichtbar'
  ) THEN
    CREATE POLICY "Leads sind für alle authentifizierten User sichtbar"
      ON public.leads
      FOR ALL
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- REST-Schema-Cache neu laden (optional)
NOTIFY pgrst, 'reload schema';