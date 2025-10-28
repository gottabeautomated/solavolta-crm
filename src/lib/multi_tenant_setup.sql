-- =====================================================
-- MULTI-TENANT SETUP
-- =====================================================
-- Erstellt die Tenant-Struktur für mandantenfähige Applikation

-- 1. TENANTS TABELLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  settings jsonb DEFAULT '{}'::jsonb
);

-- Spalten hinzufügen falls Tabelle bereits existiert
DO $$ 
BEGIN
  -- slug hinzufügen (falls nicht vorhanden)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenants' 
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN slug text;
  END IF;
  
  -- settings hinzufügen (falls nicht vorhanden)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenants' 
    AND column_name = 'settings'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  -- updated_at hinzufügen (falls nicht vorhanden)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenants' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Unique Constraint für slug hinzufügen (falls noch nicht vorhanden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tenants_slug_key'
  ) THEN
    ALTER TABLE public.tenants ADD CONSTRAINT tenants_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Index für schnelle Slug-Suche
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenants_updated_at_trigger ON public.tenants;
CREATE TRIGGER tenants_updated_at_trigger
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();

-- RLS aktivieren (Policy wird später nach tenant_memberships erstellt)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. TENANT_MEMBERSHIPS TABELLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Constraint für erlaubte Rollen (falls noch nicht vorhanden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_membership_role'
  ) THEN
    ALTER TABLE public.tenant_memberships 
    ADD CONSTRAINT check_membership_role 
    CHECK (role IN ('owner', 'admin', 'sales_admin', 'member', 'viewer'));
  END IF;
END $$;

-- Indizes
CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON public.tenant_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON public.tenant_memberships(role);

-- RLS aktivieren
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Alte Policies löschen (falls vorhanden) - inkl. fehlerhafter Policies
DROP POLICY IF EXISTS memberships_select ON public.tenant_memberships;
DROP POLICY IF EXISTS memberships_select_admin ON public.tenant_memberships;
DROP POLICY IF EXISTS memberships_insert ON public.tenant_memberships;
DROP POLICY IF EXISTS memberships_update ON public.tenant_memberships;
DROP POLICY IF EXISTS memberships_delete ON public.tenant_memberships;
DROP POLICY IF EXISTS tm_select_own ON public.tenant_memberships;
DROP POLICY IF EXISTS tm_service_role_all ON public.tenant_memberships;
DROP POLICY IF EXISTS memberships_select_own ON public.tenant_memberships;
DROP POLICY IF EXISTS memberships_service_role ON public.tenant_memberships;

-- EINFACHE Policy ohne Rekursion: User kann nur eigene Memberships sehen
CREATE POLICY memberships_select_own ON public.tenant_memberships
  FOR SELECT
  USING (user_id = auth.uid());

-- Service Role darf alles (für Admin-Operationen via Backend)
CREATE POLICY memberships_service_role ON public.tenant_memberships
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- JETZT Tenants-Policy erstellen (nachdem tenant_memberships existiert)
DROP POLICY IF EXISTS tenants_select ON public.tenants;
CREATE POLICY tenants_select ON public.tenants
  FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM public.tenant_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- 3. TENANT_ID zu LEADS hinzufügen (falls noch nicht vorhanden)
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.leads 
    ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
    
    CREATE INDEX idx_leads_tenant_id ON public.leads(tenant_id);
  END IF;
END $$;

-- 4. TENANT_ID zu APPOINTMENTS hinzufügen (falls noch nicht vorhanden)
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.appointments 
    ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
    
    CREATE INDEX idx_appointments_tenant_id ON public.appointments(tenant_id);
  END IF;
END $$;

-- 5. RLS POLICIES für LEADS anpassen
-- =====================================================

-- Alte Policies entfernen
DROP POLICY IF EXISTS leads_select ON public.leads;
DROP POLICY IF EXISTS leads_insert ON public.leads;
DROP POLICY IF EXISTS leads_update ON public.leads;
DROP POLICY IF EXISTS leads_delete ON public.leads;

-- Neue Policies mit Tenant-Check
CREATE POLICY leads_select ON public.leads
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tm.tenant_id 
      FROM public.tenant_memberships tm 
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY leads_insert ON public.leads
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tm.tenant_id 
      FROM public.tenant_memberships tm 
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY leads_update ON public.leads
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tm.tenant_id 
      FROM public.tenant_memberships tm 
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY leads_delete ON public.leads
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tm.tenant_id 
      FROM public.tenant_memberships tm 
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- 6. HELPER FUNCTIONS
-- =====================================================

-- Funktion: Prüfe ob User Admin/Owner in Tenant ist
-- CASCADE löscht auch abhängige Policies (werden später neu erstellt)
DROP FUNCTION IF EXISTS public.is_tenant_admin(uuid, uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.is_tenant_admin(check_tenant_id uuid, check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = check_tenant_id
    AND user_id = check_user_id
    AND role IN ('owner', 'admin', 'sales_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Hole alle Tenants eines Users
DROP FUNCTION IF EXISTS public.get_user_tenants(uuid);
CREATE OR REPLACE FUNCTION public.get_user_tenants(check_user_id uuid)
RETURNS TABLE (
  tenant_id uuid,
  tenant_name text,
  tenant_slug text,
  user_role text,
  joined_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.slug,
    tm.role,
    tm.created_at
  FROM public.tenants t
  INNER JOIN public.tenant_memberships tm ON t.id = tm.tenant_id
  WHERE tm.user_id = check_user_id
  ORDER BY tm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. VIEWS
-- =====================================================

-- View: Tenant-Statistiken
CREATE OR REPLACE VIEW public.tenant_stats AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  COUNT(DISTINCT tm.user_id) as member_count,
  COUNT(DISTINCT l.id) as lead_count,
  COUNT(DISTINCT a.id) as appointment_count,
  t.created_at
FROM public.tenants t
LEFT JOIN public.tenant_memberships tm ON t.id = tm.tenant_id
LEFT JOIN public.leads l ON t.id = l.tenant_id
LEFT JOIN public.appointments a ON t.id = a.tenant_id
GROUP BY t.id, t.name, t.created_at;

-- 8. INITIAL DATEN (Optional - für Testing)
-- =====================================================

-- Kommentiere die nächsten Zeilen aus, wenn du Test-Daten möchtest:
/*
-- Test-Tenant erstellen
INSERT INTO public.tenants (id, name, slug)
VALUES ('a0668e3e-d954-40e9-bcdd-bd47566d2b1f', 'SolaVolta PV', 'solavolta-pv')
ON CONFLICT (id) DO NOTHING;

-- Aktuellen User als Owner hinzufügen (ersetze USER_ID mit echter UUID)
-- INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
-- VALUES ('a0668e3e-d954-40e9-bcdd-bd47566d2b1f', 'DEINE_USER_ID_HIER', 'owner')
-- ON CONFLICT DO NOTHING;
*/

-- 9. MIGRIERE BESTEHENDE DATEN (falls vorhanden)
-- =====================================================

-- Generiere Slugs für bestehende Tenants ohne Slug
UPDATE public.tenants 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Dedupliziere Slugs (falls Konflikte entstanden sind)
DO $$
DECLARE
  tenant_rec RECORD;
  new_slug text;
  counter integer;
BEGIN
  FOR tenant_rec IN 
    SELECT id, name, slug 
    FROM public.tenants 
    WHERE slug IS NOT NULL
  LOOP
    counter := 1;
    new_slug := tenant_rec.slug;
    
    -- Prüfe auf Duplikate und füge Nummer hinzu
    WHILE EXISTS (
      SELECT 1 FROM public.tenants 
      WHERE slug = new_slug 
      AND id != tenant_rec.id
    ) LOOP
      new_slug := tenant_rec.slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Update falls geändert
    IF new_slug != tenant_rec.slug THEN
      UPDATE public.tenants 
      SET slug = new_slug 
      WHERE id = tenant_rec.id;
    END IF;
  END LOOP;
END $$;

-- Setze einen Standard-Tenant für bestehende Leads ohne tenant_id
DO $$ 
DECLARE
  default_tenant_id uuid;
BEGIN
  -- Ersten Tenant als Default nehmen oder neuen erstellen
  SELECT id INTO default_tenant_id FROM public.tenants LIMIT 1;
  
  IF default_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, slug)
    VALUES ('Standard Tenant', 'standard')
    RETURNING id INTO default_tenant_id;
  END IF;
  
  -- Leads ohne tenant_id updaten
  UPDATE public.leads 
  SET tenant_id = default_tenant_id 
  WHERE tenant_id IS NULL;
  
  -- Appointments ohne tenant_id updaten
  UPDATE public.appointments 
  SET tenant_id = default_tenant_id 
  WHERE tenant_id IS NULL;
END $$;

-- 10. CONSTRAINTS
-- =====================================================

-- tenant_id darf nicht NULL sein (nach Migration)
DO $$
BEGIN
  -- Prüfe ob alle Leads einen tenant_id haben
  IF NOT EXISTS (SELECT 1 FROM public.leads WHERE tenant_id IS NULL) THEN
    ALTER TABLE public.leads ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
  
  -- Prüfe ob alle Appointments einen tenant_id haben
  IF NOT EXISTS (SELECT 1 FROM public.appointments WHERE tenant_id IS NULL) THEN
    ALTER TABLE public.appointments ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- =====================================================
-- FERTIG! Multi-Tenant Setup abgeschlossen
-- =====================================================

-- 11. POLICIES NEU ERSTELLEN (falls durch CASCADE gelöscht)
-- =====================================================

-- Policies für enhanced_follow_ups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'enhanced_follow_ups' 
    AND policyname = 'efu_select_role_or_owner'
  ) THEN
    CREATE POLICY efu_select_role_or_owner ON public.enhanced_follow_ups
      FOR SELECT
      USING (
        tenant_id IN (
          SELECT tm.tenant_id FROM public.tenant_memberships tm 
          WHERE tm.user_id = auth.uid()
        )
        OR public.is_tenant_admin(tenant_id, auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'enhanced_follow_ups' 
    AND policyname = 'efu_write_role_or_owner'
  ) THEN
    CREATE POLICY efu_write_role_or_owner ON public.enhanced_follow_ups
      FOR ALL
      USING (
        tenant_id IN (
          SELECT tm.tenant_id FROM public.tenant_memberships tm 
          WHERE tm.user_id = auth.uid()
        )
        OR public.is_tenant_admin(tenant_id, auth.uid())
      );
  END IF;
END $$;

-- Policies für appointments (zusätzlich zu den bereits erstellten)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'appointments' 
    AND policyname = 'appt_select_role_or_owner'
  ) THEN
    CREATE POLICY appt_select_role_or_owner ON public.appointments
      FOR SELECT
      USING (
        tenant_id IN (
          SELECT tm.tenant_id FROM public.tenant_memberships tm 
          WHERE tm.user_id = auth.uid()
        )
        OR public.is_tenant_admin(tenant_id, auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'appointments' 
    AND policyname = 'appt_write_role_or_owner'
  ) THEN
    CREATE POLICY appt_write_role_or_owner ON public.appointments
      FOR ALL
      USING (
        tenant_id IN (
          SELECT tm.tenant_id FROM public.tenant_memberships tm 
          WHERE tm.user_id = auth.uid()
        )
        OR public.is_tenant_admin(tenant_id, auth.uid())
      );
  END IF;
END $$;

-- Policies für leads (zusätzlich zu den bereits erstellten)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'leads' 
    AND policyname = 'leads_select_role_or_owner'
  ) THEN
    CREATE POLICY leads_select_role_or_owner ON public.leads
      FOR SELECT
      USING (
        tenant_id IN (
          SELECT tm.tenant_id FROM public.tenant_memberships tm 
          WHERE tm.user_id = auth.uid()
        )
        OR public.is_tenant_admin(tenant_id, auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'leads' 
    AND policyname = 'leads_modify_role_or_owner'
  ) THEN
    CREATE POLICY leads_modify_role_or_owner ON public.leads
      FOR ALL
      USING (
        tenant_id IN (
          SELECT tm.tenant_id FROM public.tenant_memberships tm 
          WHERE tm.user_id = auth.uid()
        )
        OR public.is_tenant_admin(tenant_id, auth.uid())
      );
  END IF;
END $$;

-- =====================================================
-- FERTIG! Multi-Tenant Setup abgeschlossen
-- =====================================================

-- Überprüfung der Installation
SELECT 
  'Tenants' as table_name, 
  COUNT(*) as count 
FROM public.tenants
UNION ALL
SELECT 
  'Tenant Memberships' as table_name, 
  COUNT(*) as count 
FROM public.tenant_memberships
UNION ALL
SELECT 
  'Leads mit Tenant' as table_name, 
  COUNT(*) as count 
FROM public.leads 
WHERE tenant_id IS NOT NULL;

COMMENT ON TABLE public.tenants IS 'Mandanten-Verwaltung für Multi-Tenant-Applikation';
COMMENT ON TABLE public.tenant_memberships IS 'Zuordnung von Benutzern zu Mandanten mit Rollen';
COMMENT ON COLUMN public.tenant_memberships.role IS 'Rolle: owner, admin, sales_admin, member, viewer';
