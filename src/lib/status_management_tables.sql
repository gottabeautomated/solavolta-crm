-- Status-Management Tabellen für Lead-Dashboard
-- Führe dieses Script in deinem Supabase SQL Editor aus

-- 1. Status-Änderungen Historie
CREATE TABLE IF NOT EXISTS status_changes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  changed_at timestamp with time zone DEFAULT now(),
  reason text,
  notes text
);

-- 2. Benachrichtigungen
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('status_change', 'follow_up', 'appointment', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  action_url text
);

-- 3. Status-Regeln (für erweiterte Automatisierung)
CREATE TABLE IF NOT EXISTS status_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  trigger_condition text NOT NULL,
  action text NOT NULL,
  parameters jsonb,
  enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_status_changes_lead_id ON status_changes(lead_id);
CREATE INDEX IF NOT EXISTS idx_status_changes_changed_at ON status_changes(changed_at);
CREATE INDEX IF NOT EXISTS idx_status_changes_changed_by ON status_changes(changed_by);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_lead_id ON notifications(lead_id);

CREATE INDEX IF NOT EXISTS idx_status_rules_enabled ON status_rules(enabled);

-- Row Level Security (RLS) Policies

-- Status Changes Policies
ALTER TABLE status_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view status changes for leads they have access to" ON status_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = status_changes.lead_id 
      AND leads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert status changes for their leads" ON status_changes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = status_changes.lead_id 
      AND leads.user_id = auth.uid()
    ) AND changed_by = auth.uid()
  );

-- Notifications Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert notifications for themselves" ON notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- Status Rules Policies (Admin only)
ALTER TABLE status_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only authenticated users can view status rules" ON status_rules
  FOR SELECT USING (auth.role() = 'authenticated');

-- Funktionen für automatische Updates

-- Funktion zum Anwenden von Status-Regeln
CREATE OR REPLACE FUNCTION apply_status_rules_to_lead(lead_id uuid)
RETURNS void AS $$
DECLARE
  lead_record leads%ROWTYPE;
  rule_record status_rules%ROWTYPE;
  updates jsonb;
BEGIN
  -- Lead-Daten laden
  SELECT * INTO lead_record FROM leads WHERE id = lead_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Alle aktiven Regeln durchgehen
  FOR rule_record IN SELECT * FROM status_rules WHERE enabled = true ORDER BY created_at
  LOOP
    -- Hier würde die Regel-Logik implementiert werden
    -- Für jetzt ist es ein Platzhalter
    NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für automatische Status-Updates
CREATE OR REPLACE FUNCTION trigger_status_rules()
RETURNS trigger AS $$
BEGIN
  -- Status-Regeln anwenden wenn sich relevante Felder ändern
  IF (OLD.phone_status IS DISTINCT FROM NEW.phone_status) OR
     (OLD.lead_status IS DISTINCT FROM NEW.lead_status) OR
     (OLD.appointment_date IS DISTINCT FROM NEW.appointment_date) THEN
    
    PERFORM apply_status_rules_to_lead(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger erstellen
DROP TRIGGER IF EXISTS leads_status_rules_trigger ON leads;
CREATE TRIGGER leads_status_rules_trigger
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_status_rules();

-- Kommentare für bessere Dokumentation
COMMENT ON TABLE status_changes IS 'Historie aller Status-Änderungen für Leads';
COMMENT ON TABLE notifications IS 'In-App Benachrichtigungen für Benutzer';
COMMENT ON TABLE status_rules IS 'Automatisierungsregeln für Status-Updates';

COMMENT ON COLUMN status_changes.old_status IS 'Vorheriger Status (kann NULL sein bei erstem Status)';
COMMENT ON COLUMN status_changes.new_status IS 'Neuer Status';
COMMENT ON COLUMN status_changes.changed_by IS 'Benutzer der die Änderung vorgenommen hat';
COMMENT ON COLUMN status_changes.reason IS 'Grund für die Status-Änderung';
COMMENT ON COLUMN status_changes.notes IS 'Zusätzliche Notizen zur Änderung';

COMMENT ON COLUMN notifications.type IS 'Art der Benachrichtigung: status_change, follow_up, appointment, system';
COMMENT ON COLUMN notifications.read IS 'Ob die Benachrichtigung gelesen wurde';
COMMENT ON COLUMN notifications.action_url IS 'Optional: URL für direkte Aktion'; 