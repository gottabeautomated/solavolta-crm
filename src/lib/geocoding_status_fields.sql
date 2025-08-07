-- Geocoding-Status Felder zur Tabelle leads hinzufügen
ALTER TABLE leads ADD COLUMN IF NOT EXISTS geocoding_status text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS geocoding_error text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;

-- Indexe für häufige Abfragen
CREATE INDEX IF NOT EXISTS idx_leads_geocoding_status ON leads(geocoding_status);

-- Bestehende Leads ohne Koordinaten initial markieren
UPDATE leads 
SET geocoding_status = 'pending' 
WHERE lat IS NULL AND lng IS NULL AND address IS NOT NULL AND geocoding_status IS NULL;

-- Trigger-Funktion: Bei neuer/aktualisierter Adresse Status zurücksetzen
CREATE OR REPLACE FUNCTION trigger_geocoding()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.address IS NOT NULL AND NEW.lat IS NULL)
       OR (TG_OP = 'UPDATE' AND OLD.address IS DISTINCT FROM NEW.address AND NEW.address IS NOT NULL) THEN
        NEW.geocoding_status = 'pending';
        NEW.geocoding_error = NULL;
        NEW.geocoded_at = NULL;
        IF TG_OP = 'UPDATE' AND OLD.address IS DISTINCT FROM NEW.address THEN
            NEW.lat = NULL;
            NEW.lng = NULL;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lead_geocoding ON leads;
CREATE TRIGGER trigger_lead_geocoding
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION trigger_geocoding();


