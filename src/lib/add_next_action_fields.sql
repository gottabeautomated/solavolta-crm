-- Neue Felder für "Nächste Aktion" zur leads Tabelle hinzufügen
-- Führe dieses Script in deiner Supabase SQL Editor aus

-- Neue Felder hinzufügen
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS next_action text,
ADD COLUMN IF NOT EXISTS next_action_date date,
ADD COLUMN IF NOT EXISTS next_action_time text,
ADD COLUMN IF NOT EXISTS preliminary_offer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS lost_reason text;

-- Kommentare für bessere Dokumentation
COMMENT ON COLUMN leads.next_action IS 'Nächste Aktion basierend auf Telefonstatus (appointment, offer, follow_up, note)';
COMMENT ON COLUMN leads.next_action_date IS 'Datum für die nächste Aktion';
COMMENT ON COLUMN leads.next_action_time IS 'Zeit für die nächste Aktion (bei Terminen)';
COMMENT ON COLUMN leads.preliminary_offer IS 'Vorabangebot erstellt (bei Angebot-Aktion)';
COMMENT ON COLUMN leads.lost_reason IS 'Grund für verlorenen Lead (kein_interesse, andere_firma, verschoben, nicht_erreichbar)';

-- Optional: Index für bessere Performance bei Abfragen
CREATE INDEX IF NOT EXISTS idx_leads_next_action ON leads(next_action);
CREATE INDEX IF NOT EXISTS idx_leads_next_action_date ON leads(next_action_date);
CREATE INDEX IF NOT EXISTS idx_leads_lost_reason ON leads(lost_reason); 