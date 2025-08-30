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

-- Archiv-Flag idempotent hinzufügen
ALTER TABLE leads ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- === SALES AUTOMATION: Zusätzliche Felder auf leads (idempotent) ===
ALTER TABLE leads ADD COLUMN IF NOT EXISTS appointment_channel text CHECK (appointment_channel IN ('telefon', 'vor_ort', 'online'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS appointment_completed boolean DEFAULT false;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS offer_created_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS offer_sent_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS offer_amount numeric(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS offer_link text;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS won_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_competitor text;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS paused_until date;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pause_reason text;

-- === SALES AUTOMATION: Metriken ===
CREATE TABLE IF NOT EXISTS sales_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  metric_value numeric,
  metric_date date DEFAULT CURRENT_DATE,
  additional_data jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT sales_metrics_tenant_check CHECK (tenant_id IS NOT NULL)
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_leads_offer_created ON leads(offer_created_at) WHERE offer_created_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_paused_until ON leads(paused_until) WHERE paused_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_metrics_type_date ON sales_metrics(metric_type, metric_date);
CREATE INDEX IF NOT EXISTS idx_sales_metrics_tenant ON sales_metrics(tenant_id, metric_date);

-- RLS
ALTER TABLE sales_metrics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename='sales_metrics' AND p.policyname='Users can view sales_metrics for their tenant'
  ) THEN
    CREATE POLICY "Users can view sales_metrics for their tenant" ON sales_metrics
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.user_id = auth.uid() AND m.tenant_id = sales_metrics.tenant_id
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename='sales_metrics' AND p.policyname='Users can insert sales_metrics for their tenant'
  ) THEN
    CREATE POLICY "Users can insert sales_metrics for their tenant" ON sales_metrics
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.user_id = auth.uid() AND m.tenant_id = sales_metrics.tenant_id
        )
      );
  END IF;
END $$;

-- SLA-Status View
CREATE OR REPLACE VIEW sla_status AS
SELECT 
  l.id,
  l.name,
  l.lead_status,
  l.created_at,
  l.updated_at,
  l.tenant_id,
  CASE 
    WHEN l.lead_status = 'Neu' AND EXTRACT(EPOCH FROM (now() - l.created_at))/3600 > 24 THEN 'BREACH'
    WHEN l.lead_status = 'Neu' THEN 'ACTIVE'
    ELSE 'OK'
  END as first_contact_sla,
  CASE 
    WHEN l.lead_status = 'Angebot angefragt' AND EXTRACT(EPOCH FROM (now() - l.updated_at))/3600 > 48 THEN 'BREACH'
    WHEN l.lead_status = 'Angebot angefragt' THEN 'ACTIVE'
    ELSE 'OK'
  END as offer_creation_sla,
  CASE 
    WHEN l.lead_status = 'Angebot erstellt' AND EXTRACT(EPOCH FROM (now() - l.updated_at))/3600 > 72 THEN 'BREACH'
    WHEN l.lead_status = 'Angebot erstellt' THEN 'ACTIVE'
    ELSE 'OK'
  END as offer_followup_sla
FROM leads l;

-- Trigger zum Loggen von Sales-Metriken
CREATE OR REPLACE FUNCTION log_sales_metric()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.lead_status IS DISTINCT FROM NEW.lead_status THEN
    INSERT INTO sales_metrics (tenant_id, lead_id, metric_type, metric_value, additional_data)
    VALUES (
      NEW.tenant_id,
      NEW.id,
      'status_change',
      1,
      jsonb_build_object('from_status', OLD.lead_status, 'to_status', NEW.lead_status, 'change_time', now())
    );
    CASE NEW.lead_status
      WHEN 'Gewonnen' THEN
        INSERT INTO sales_metrics (tenant_id, lead_id, metric_type, metric_value, additional_data)
        VALUES (
          NEW.tenant_id, NEW.id, 'won', COALESCE(NEW.offer_amount, 0), jsonb_build_object('won_at', now(), 'days_to_close', EXTRACT(day FROM now() - NEW.created_at))
        );
      WHEN 'Verloren' THEN
        INSERT INTO sales_metrics (tenant_id, lead_id, metric_type, metric_value, additional_data)
        VALUES (
          NEW.tenant_id, NEW.id, 'lost', 0, jsonb_build_object('lost_reason', NEW.lost_reason, 'lost_competitor', NEW.lost_competitor)
        );
      WHEN 'Angebot erstellt' THEN
        INSERT INTO sales_metrics (tenant_id, lead_id, metric_type, metric_value, additional_data)
        VALUES (
          NEW.tenant_id, NEW.id, 'offer_created', COALESCE(NEW.offer_amount, 0), jsonb_build_object('offer_created_at', NEW.offer_created_at)
        );
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_log_sales_metric ON leads;
CREATE TRIGGER trigger_log_sales_metric
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION log_sales_metric();

-- RPC für KPIs
CREATE OR REPLACE FUNCTION get_sales_kpis(tenant_uuid uuid, days_back integer DEFAULT 30)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  WITH date_range AS (
    SELECT CURRENT_DATE - days_back AS start_date, CURRENT_DATE AS end_date
  ),
  base_metrics AS (
    SELECT 
      COUNT(*) FILTER (WHERE l.created_at >= dr.start_date) as new_leads,
      COUNT(*) FILTER (WHERE l.lead_status = 'Gewonnen' AND l.won_at >= dr.start_date) as won_leads,
      COUNT(*) FILTER (WHERE l.lead_status = 'Verloren' AND l.updated_at >= dr.start_date) as lost_leads,
      COUNT(*) FILTER (WHERE l.lead_status = 'Angebot erstellt') as offers_out,
      COUNT(*) FILTER (WHERE l.lead_status IN ('Neu', 'Nicht erreicht 1x', 'Nicht erreicht 2x', 'Nicht erreicht 3x')) as in_contact_phase,
      COUNT(*) FILTER (WHERE ss.first_contact_sla = 'BREACH') as first_contact_breaches,
      COUNT(*) FILTER (WHERE ss.offer_creation_sla = 'BREACH') as offer_creation_breaches,
      COUNT(*) FILTER (WHERE ss.offer_followup_sla = 'BREACH') as offer_followup_breaches,
      AVG(EXTRACT(EPOCH FROM (COALESCE(l.won_at, l.updated_at) - l.created_at))/3600) FILTER (WHERE l.lead_status = 'Gewonnen') as avg_hours_to_close,
      AVG(EXTRACT(EPOCH FROM (l.offer_created_at - l.created_at))/3600) FILTER (WHERE l.offer_created_at IS NOT NULL) as avg_hours_to_offer
    FROM leads l
    CROSS JOIN date_range dr
    LEFT JOIN sla_status ss ON l.id = ss.id
    WHERE l.tenant_id = tenant_uuid
  )
  SELECT jsonb_build_object(
    'new_leads', bm.new_leads,
    'won_leads', bm.won_leads,
    'lost_leads', bm.lost_leads,
    'offers_out', bm.offers_out,
    'in_contact_phase', bm.in_contact_phase,
    'conversion_rate', CASE WHEN bm.new_leads > 0 THEN ROUND((bm.won_leads::float / bm.new_leads * 100), 1) ELSE 0 END,
    'offer_rate', CASE WHEN bm.new_leads > 0 THEN ROUND(((bm.offers_out + bm.won_leads::float) / bm.new_leads * 100), 1) ELSE 0 END,
    'sla_breaches', bm.first_contact_breaches + bm.offer_creation_breaches + bm.offer_followup_breaches,
    'avg_hours_to_close', ROUND(bm.avg_hours_to_close, 1),
    'avg_hours_to_offer', ROUND(bm.avg_hours_to_offer, 1),
    'days_analyzed', days_back
  ) INTO result
  FROM base_metrics bm;
  RETURN result;
END;
$$ language 'plpgsql';

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
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_coordinates ON leads(lat, lng);

-- Migration Helpers: Termine/Follow-ups aus Leads extrahieren (idempotent)
-- 1) Termine migrieren
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='appointment_date') THEN
    INSERT INTO public.appointments (tenant_id, lead_id, starts_at, notes)
    SELECT l.tenant_id, l.id, (l.appointment_date::text || ' ' || COALESCE(NULLIF(l.appointment_time,''),'09:00'))::timestamptz, 'Migrated from leads'
    FROM public.leads l
    LEFT JOIN public.appointments a ON a.lead_id = l.id AND a.starts_at::date = l.appointment_date
    WHERE l.appointment_date IS NOT NULL AND a.id IS NULL;
  END IF;
END $$;

-- 2) Follow-ups migrieren
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='follow_up_date') THEN
    INSERT INTO public.enhanced_follow_ups (tenant_id, lead_id, type, due_date, priority, auto_generated, escalation_level, notes)
    SELECT l.tenant_id, l.id, 'followup', l.follow_up_date, 'medium', false, 0, 'Migrated from leads'
    FROM public.leads l
    LEFT JOIN public.enhanced_follow_ups e ON e.lead_id = l.id AND e.due_date = l.follow_up_date AND e.completed_at IS NULL
    WHERE l.follow_up = true AND l.follow_up_date IS NOT NULL AND e.id IS NULL;
  END IF;
END $$;

-- Automatische Status-Setzung bei Terminerstellung
CREATE OR REPLACE FUNCTION public.set_lead_status_on_appointment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.leads
  SET lead_status = 'Termin vereinbart', updated_at = now()
  WHERE id = NEW.lead_id AND (lead_status IS NULL OR lead_status <> 'Termin vereinbart');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tg_set_lead_status_on_appointment'
  ) THEN
    CREATE TRIGGER tg_set_lead_status_on_appointment
    AFTER INSERT ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.set_lead_status_on_appointment();
  END IF;
END $$;

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

-- =============================================
-- CLEANUP: Legacy Lead-Felder entfernen (nach Migration)
-- - appointment_* und follow_up* werden nicht mehr verwendet
-- - Vor dem DROP wird einmalig ein Backup erstellt
-- =============================================

-- Backup-Tabelle (einmalig) mit den Legacy-Feldern anlegen
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads_legacy_backup'
  ) THEN
    CREATE TABLE public.leads_legacy_backup AS
      SELECT id AS lead_id,
             appointment_date,
             appointment_time,
             appointment_channel,
             appointment_completed,
             calendar_link,
             follow_up,
             follow_up_date
      FROM public.leads;
    ALTER TABLE public.leads_legacy_backup ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Nicht mehr benötigte Indizes entfernen
DROP INDEX IF EXISTS idx_leads_appointment_date;
DROP INDEX IF EXISTS idx_leads_follow_up;

-- Legacy-Spalten idempotent entfernen
ALTER TABLE public.leads
  DROP COLUMN IF EXISTS appointment_date,
  DROP COLUMN IF EXISTS appointment_time,
  DROP COLUMN IF EXISTS appointment_channel,
  DROP COLUMN IF EXISTS appointment_completed,
  DROP COLUMN IF EXISTS calendar_link,
  DROP COLUMN IF EXISTS follow_up,
  DROP COLUMN IF EXISTS follow_up_date;

-- Schema-Cache aktualisieren
NOTIFY pgrst, 'reload schema';

-- =============================================
-- DASHBOARD VIEWS – SECURITY INVOKER UND TENANT-ISOLATION
-- Hinweis: RLS gilt für Tabellen, nicht für (normale) Views. Wir stellen daher
-- sicher, dass die Views mit den Rechten des aufrufenden Users laufen
-- (security_invoker = true) und zusätzlich explizit nach Tenant filtern.
-- =============================================

-- v_today_tasks: Aufgaben für heute (Kontaktversuche, Fällige FUs, neue Leads)
DROP VIEW IF EXISTS public.v_today_tasks CASCADE;
CREATE VIEW public.v_today_tasks
WITH (security_invoker = true)
AS
SELECT
  l.id,
  l.name,
  l.phone,
  l.lead_status,
  l.tenant_id,
  CASE
    WHEN ca.next_attempt_date = CURRENT_DATE THEN 'contact_attempt'
    WHEN efu.due_date = CURRENT_DATE AND efu.completed_at IS NULL THEN 'follow_up'
    WHEN l.lead_status ILIKE 'Neu%' OR l.lead_status ILIKE 'Nicht erreicht%'
      THEN 'contact_status'
    ELSE NULL
  END AS task_type
FROM public.leads l
LEFT JOIN public.contact_attempts ca
  ON ca.lead_id = l.id
  AND ca.tenant_id = l.tenant_id
  AND ca.next_attempt_date = CURRENT_DATE
LEFT JOIN public.enhanced_follow_ups efu
  ON efu.lead_id = l.id
  AND efu.tenant_id = l.tenant_id
  AND efu.due_date = CURRENT_DATE
  AND efu.completed_at IS NULL
WHERE
  -- Mandanten-Isolation über memberships
  EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = l.tenant_id
  )
  AND COALESCE(l.archived, false) = false;

-- Optional: Übersicht kommende Termine je Lead (einfache Variante)
DROP VIEW IF EXISTS public.lead_next_appointments CASCADE;
CREATE VIEW public.lead_next_appointments
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (a.lead_id)
  a.lead_id,
  a.tenant_id,
  a.starts_at,
  a.notes
FROM public.appointments a
WHERE EXISTS (
  SELECT 1 FROM public.memberships m
  WHERE m.user_id = auth.uid() AND m.tenant_id = a.tenant_id
)
ORDER BY a.lead_id, a.starts_at ASC;

-- Optional: KPI-View für heutigen Tag (vereinfachte Basis)
DROP VIEW IF EXISTS public.v_kpis_today CASCADE;
CREATE VIEW public.v_kpis_today
WITH (security_invoker = true)
AS
SELECT
  l.tenant_id,
  COUNT(*) FILTER (WHERE l.created_at::date = CURRENT_DATE)               AS new_leads_today,
  COUNT(*) FILTER (WHERE l.lead_status = 'Gewonnen' AND l.won_at::date = CURRENT_DATE) AS won_today,
  COUNT(*) FILTER (WHERE l.lead_status = 'Verloren' AND l.updated_at::date = CURRENT_DATE) AS lost_today
FROM public.leads l
WHERE EXISTS (
  SELECT 1 FROM public.memberships m
  WHERE m.user_id = auth.uid() AND m.tenant_id = l.tenant_id
)
GROUP BY l.tenant_id;

-- Schema-Cache aktualisieren, damit Views sofort verfügbar sind
NOTIFY pgrst, 'reload schema';

-- v_week_overview: Anzahl EFUs und Termine je Tag der aktuellen Woche
DROP VIEW IF EXISTS public.v_week_overview CASCADE;
CREATE VIEW public.v_week_overview
WITH (security_invoker = true)
AS
WITH week_days AS (
  SELECT generate_series(date_trunc('week', CURRENT_DATE)::date,
                         (date_trunc('week', CURRENT_DATE) + interval '6 day')::date,
                         interval '1 day')::date AS day_date
)
SELECT
  d.day_date,
  l.tenant_id,
  COALESCE( (SELECT COUNT(*) FROM public.enhanced_follow_ups efu
             WHERE efu.tenant_id = l.tenant_id
               AND efu.due_date = d.day_date
               AND efu.completed_at IS NULL), 0) AS efu_count,
  COALESCE( (SELECT COUNT(*) FROM public.appointments a
             WHERE a.tenant_id = l.tenant_id
               AND a.starts_at::date = d.day_date), 0) AS appointment_count
FROM week_days d
-- eine Referenz auf Leads pro Tenant, um tenant_id zu liefern
JOIN (
  SELECT DISTINCT tenant_id FROM public.leads
  WHERE EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = leads.tenant_id
  )
) l ON true
ORDER BY d.day_date;

-- v_overdue_tasks: Überfällige FUs/Versuche (gestern und älter)
DROP VIEW IF EXISTS public.v_overdue_tasks CASCADE;
CREATE VIEW public.v_overdue_tasks
WITH (security_invoker = true)
AS
SELECT
  l.id        AS lead_id,
  l.tenant_id AS tenant_id,
  l.name      AS title,
  'efu'       AS source,
  efu.due_date::timestamp AS due_at,
  'medium'    AS priority,
  NULL::text  AS notes
FROM public.leads l
JOIN public.enhanced_follow_ups efu ON efu.lead_id = l.id AND efu.tenant_id = l.tenant_id
WHERE efu.completed_at IS NULL
  AND efu.due_date < CURRENT_DATE
  AND EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = l.tenant_id
  )
UNION ALL
SELECT
  l.id        AS lead_id,
  l.tenant_id AS tenant_id,
  l.name      AS title,
  'contact_attempt' AS source,
  ca.next_attempt_date::timestamp AS due_at,
  'medium'    AS priority,
  NULL::text  AS notes
FROM public.leads l
JOIN public.contact_attempts ca ON ca.lead_id = l.id AND ca.tenant_id = l.tenant_id
WHERE ca.next_attempt_date < CURRENT_DATE
  AND EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = l.tenant_id
  );

-- v_lead_priorities: einfache Priorisierung je Lead
DROP VIEW IF EXISTS public.v_lead_priorities CASCADE;
CREATE VIEW public.v_lead_priorities
WITH (security_invoker = true)
AS
SELECT
  l.id         AS lead_id,
  l.tenant_id  AS tenant_id,
  l.name,
  l.phone,
  l.email,
  CASE
    WHEN l.lead_status ILIKE 'Nicht erreicht 3x%' THEN 1
    WHEN l.lead_status ILIKE 'Nicht erreicht%' THEN 2
    WHEN l.lead_status = 'Neu' THEN 3
    ELSE 4
  END AS top_priority,
  NULL::timestamp AS next_due
FROM public.leads l
WHERE EXISTS (
  SELECT 1 FROM public.memberships m
  WHERE m.user_id = auth.uid() AND m.tenant_id = l.tenant_id
);

NOTIFY pgrst, 'reload schema';