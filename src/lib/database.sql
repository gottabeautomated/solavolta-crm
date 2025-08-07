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

-- Updated_at Trigger erstellen
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_coordinates ON leads(lat, lng);

-- Test-Daten einfügen
INSERT INTO leads (name, phone, email, address, lead_status, contact_type, lat, lng) VALUES
  ('Max Mustermann', '+43 664 123 4567', 'max@beispiel.com', 'Hauptstraße 1, 1010 Wien', 'Neu', 'Telefon', 48.2082, 16.3738),
  ('Anna Schmidt', '+43 664 987 6543', 'anna@test.at', 'Salzburger Straße 15, 5020 Salzburg', 'Offen', 'Vor Ort', 47.8095, 13.0550),
  ('Peter Huber', '+43 664 555 1234', 'peter@firma.at', 'Linzer Gasse 10, 4020 Linz', 'Verloren', 'Telefon', 48.3059, 14.2862),
  ('Maria Bauer', '+43 664 777 8899', 'maria@email.com', 'Grazer Straße 5, 8010 Graz', 'Gewonnen', 'E-Mail', 47.0707, 15.4395),
  ('Thomas Weber', '+43 664 111 2233', 'thomas@web.at', 'Innsbrucker Platz 3, 6020 Innsbruck', 'Offen', 'Vor Ort', 47.2692, 11.4041);

-- Row Level Security aktivieren
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy für authentifizierte User (alle Operationen erlauben)
CREATE POLICY "Leads sind für alle authentifizierten User sichtbar" ON leads
  FOR ALL USING (auth.role() = 'authenticated'); 