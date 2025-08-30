-- =============================================================
-- Backfill: leads.offers aus Supabase Storage (offers/tvp)
-- Safe/Idempotent: Befüllt nur Leads mit leerem offers-Array
-- Ausführung: Im Supabase SQL Editor laufen lassen
-- =============================================================

-- Sicherstellen, dass Spalte existiert
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS offers jsonb DEFAULT '[]'::jsonb;

-- Optional: Index für JSON-Suche
CREATE INDEX IF NOT EXISTS idx_leads_offers ON public.leads USING GIN (offers);

-- Dateien aus Buckets 'offers' und 'tvp' sammeln und Lead-ID + Typ aus dem Pfad extrahieren
WITH files AS (
  SELECT
    o.bucket_id AS bucket,
    o.name      AS path,
    o.created_at::date AS date,
    -- Pfad-Layout aus uploadOfferPdf: tenant/<tenantId>/user/<userId>/leads/<leadId>/<type>/<timestamp>_file.pdf
    regexp_replace(o.name, '.*leads/([0-9a-f\-]{36})/.*', '\1')::uuid AS lead_id,
    regexp_replace(o.name, '.*/leads/[0-9a-f\-]{36}/([^/]+)/.*', '\1')       AS offer_type
  FROM storage.objects o
  WHERE o.bucket_id IN ('offers','tvp')
    AND o.name ~ 'leads/[0-9a-f\-]{36}/'
),
offer_rows AS (
  SELECT
    lead_id,
    jsonb_build_object(
      'type', CASE WHEN offer_type IN ('pv','storage','emergency','tvp') THEN offer_type ELSE 'pv' END,
      'date', date::text,
      'storage_path', path,
      'bucket', bucket
    ) AS offer
  FROM files
),
agg AS (
  SELECT lead_id, jsonb_agg(offer ORDER BY (offer->>'date')) AS offers_agg
  FROM offer_rows
  GROUP BY lead_id
)
UPDATE public.leads l
SET offers = COALESCE(l.offers, '[]'::jsonb) || COALESCE(a.offers_agg, '[]'::jsonb)
FROM agg a
WHERE a.lead_id = l.id
  AND (l.offers IS NULL OR jsonb_array_length(l.offers) = 0);

-- Kontrolle (optional):
-- SELECT id, jsonb_array_length(offers) AS offers_count FROM public.leads ORDER BY updated_at DESC LIMIT 20;


