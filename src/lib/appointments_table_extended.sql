-- =====================================================
-- KALENDER-AUTOMATION: Erweiterte Appointments-Tabelle
-- =====================================================
-- Fügt Felder für Kalendereinladungen und Kundenkommunikation hinzu

-- Neue Spalten für Kalender-Automation
-- tenant_id wird bereits in multi_tenant_setup.sql erstellt
-- Hier nur noch weitere Felder hinzufügen
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE, -- Falls noch nicht vorhanden
ADD COLUMN IF NOT EXISTS calendar_event_id text,
ADD COLUMN IF NOT EXISTS calendar_provider text DEFAULT 'google',
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS invite_opened_at timestamptz,
ADD COLUMN IF NOT EXISTS invite_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS meeting_type text DEFAULT 'vor_ort', -- 'vor_ort', 'online', 'telefon'
ADD COLUMN IF NOT EXISTS meeting_link text,
ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Constraints
ALTER TABLE public.appointments 
ADD CONSTRAINT check_meeting_type 
CHECK (meeting_type IN ('vor_ort', 'online', 'telefon'));

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_calendar_event_id ON public.appointments(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_appointments_invite_sent ON public.appointments(invite_sent_at);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appointments_updated_at_trigger ON public.appointments;
CREATE TRIGGER appointments_updated_at_trigger
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- RLS Policy für Tenant-Isolation erweitern
DROP POLICY IF EXISTS appointments_select ON public.appointments;
CREATE POLICY appointments_select ON public.appointments
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tm.tenant_id 
      FROM public.tenant_memberships tm 
      WHERE tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS appointments_insert ON public.appointments;
CREATE POLICY appointments_insert ON public.appointments
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tm.tenant_id 
      FROM public.tenant_memberships tm 
      WHERE tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS appointments_update ON public.appointments;
CREATE POLICY appointments_update ON public.appointments
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tm.tenant_id 
      FROM public.tenant_memberships tm 
      WHERE tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS appointments_delete ON public.appointments;
CREATE POLICY appointments_delete ON public.appointments
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tm.tenant_id 
      FROM public.tenant_memberships tm 
      WHERE tm.user_id = auth.uid()
    )
  );

-- View: Appointments mit Lead-Infos
CREATE OR REPLACE VIEW public.appointments_with_lead AS
SELECT 
  a.id,
  a.tenant_id,
  a.lead_id,
  a.starts_at,
  a.duration_minutes,
  a.meeting_type,
  a.location,
  a.meeting_link,
  a.notes,
  a.status,
  a.calendar_event_id,
  a.calendar_provider,
  a.customer_email,
  a.customer_phone,
  a.invite_sent_at,
  a.invite_opened_at,
  a.invite_accepted_at,
  a.reminder_sent_at,
  a.created_at,
  a.updated_at,
  l.name as lead_name,
  l.email as lead_email,
  l.phone as lead_phone,
  l.address as lead_address,
  l.lead_status
FROM public.appointments a
LEFT JOIN public.leads l ON a.lead_id = l.id;

-- View: Nächste ausstehende Einladungen (für n8n Cron)
CREATE OR REPLACE VIEW public.pending_appointment_invites AS
SELECT 
  a.id,
  a.tenant_id,
  a.lead_id,
  a.starts_at,
  a.customer_email,
  a.meeting_type,
  a.location,
  a.meeting_link,
  a.duration_minutes,
  a.notes,
  l.name as customer_name,
  l.phone as customer_phone
FROM public.appointments a
LEFT JOIN public.leads l ON a.lead_id = l.id
WHERE a.invite_sent_at IS NULL
  AND a.starts_at > now()
  AND a.customer_email IS NOT NULL
ORDER BY a.starts_at ASC;

-- View: Anstehende Termine für Reminder (24h vorher)
CREATE OR REPLACE VIEW public.appointments_needing_reminder AS
SELECT 
  a.id,
  a.tenant_id,
  a.lead_id,
  a.starts_at,
  a.customer_email,
  a.meeting_type,
  a.location,
  a.meeting_link,
  l.name as customer_name
FROM public.appointments a
LEFT JOIN public.leads l ON a.lead_id = l.id
WHERE a.reminder_sent_at IS NULL
  AND a.invite_sent_at IS NOT NULL
  AND a.starts_at BETWEEN now() + interval '23 hours' AND now() + interval '25 hours'
  AND a.customer_email IS NOT NULL
ORDER BY a.starts_at ASC;

COMMENT ON TABLE public.appointments IS 'Terminverwaltung mit automatischer Kalendereinladung und Kundenkommunikation';
COMMENT ON COLUMN public.appointments.calendar_event_id IS 'Google Calendar Event ID für Sync';
COMMENT ON COLUMN public.appointments.invite_sent_at IS 'Zeitpunkt des Einladungsversands';
COMMENT ON COLUMN public.appointments.invite_opened_at IS 'Zeitpunkt wenn Kunde Einladung geöffnet hat';
COMMENT ON COLUMN public.appointments.invite_accepted_at IS 'Zeitpunkt der Terminbestätigung durch Kunden';

