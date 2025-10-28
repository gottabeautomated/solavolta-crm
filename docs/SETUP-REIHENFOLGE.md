# 🚀 Setup-Reihenfolge: Kalender-Automation

## ⚠️ WICHTIG: Richtige Ausführungsreihenfolge!

Die SQL-Scripts müssen in dieser **exakten Reihenfolge** ausgeführt werden:

---

## Schritt 1️⃣: Multi-Tenant Basis erstellen

**Datei:** `src/lib/multi_tenant_setup.sql`

**Was macht es:**
- Erstellt `tenants` Tabelle
- Erstellt `tenant_memberships` Tabelle
- Fügt `tenant_id` zu `leads` und `appointments` hinzu
- Richtet RLS Policies ein
- Erstellt Helper-Functions

**Ausführen:**
```bash
# In Supabase SQL Editor:
# 1. Datei öffnen: src/lib/multi_tenant_setup.sql
# 2. Komplettes SQL ausführen
# 3. Warten bis fertig (kann 10-20 Sekunden dauern)
```

**Prüfen:**
```sql
-- Sollte 3 Zeilen zurückgeben:
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
```

---

## Schritt 2️⃣: Deinen User zum Tenant hinzufügen

**Wichtig:** Ohne diesen Schritt kannst du keine Termine erstellen!

```sql
-- 1. Deine User-ID herausfinden:
SELECT id, email FROM auth.users WHERE email = 'DEINE_EMAIL@example.com';

-- 2. Dich als Owner des Standard-Tenants hinzufügen:
INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
VALUES (
  (SELECT id FROM public.tenants LIMIT 1), -- Ersten Tenant nehmen
  'DEINE_USER_ID_HIER',                    -- User-ID aus Schritt 1
  'owner'
)
ON CONFLICT (tenant_id, user_id) DO NOTHING;
```

**Prüfen:**
```sql
-- Sollte deine Membership zeigen:
SELECT t.name, tm.role, tm.created_at
FROM public.tenant_memberships tm
JOIN public.tenants t ON tm.tenant_id = t.id
WHERE tm.user_id = auth.uid();
```

---

## Schritt 3️⃣: Appointments-Tabelle erweitern

**Datei:** `src/lib/appointments_table_extended.sql`

**Was macht es:**
- Fügt Kalender-Felder hinzu (`calendar_event_id`, `invite_sent_at`, etc.)
- Erstellt Views für Reporting
- Richtet Reminder-Views ein
- Aktualisiert RLS Policies

**Ausführen:**
```bash
# In Supabase SQL Editor:
# 1. Datei öffnen: src/lib/appointments_table_extended.sql
# 2. Komplettes SQL ausführen
```

**Prüfen:**
```sql
-- Sollte neue Spalten zeigen:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name IN ('calendar_event_id', 'invite_sent_at', 'meeting_type');
```

---

## Schritt 4️⃣: Test-Termin erstellen

```sql
-- Test-Termin einfügen:
INSERT INTO public.appointments (
  tenant_id,
  lead_id,
  starts_at,
  duration_minutes,
  meeting_type,
  customer_email,
  notes,
  status
)
VALUES (
  (SELECT id FROM public.tenants LIMIT 1),
  (SELECT id FROM public.leads LIMIT 1), -- Ersten Lead nehmen
  NOW() + INTERVAL '1 day',              -- Morgen
  60,
  'online',
  'test@example.com',
  'Test-Termin für Kalender-Automation',
  'scheduled'
);

-- Prüfen:
SELECT id, starts_at, meeting_type, customer_email 
FROM public.appointments 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## ✅ Checkliste nach Setup

- [ ] `tenants` Tabelle existiert
- [ ] `tenant_memberships` Tabelle existiert
- [ ] Mindestens 1 Tenant vorhanden
- [ ] Dein User ist als Owner/Admin zugeordnet
- [ ] `appointments` hat neue Spalten (`calendar_event_id`, etc.)
- [ ] Test-Termin erfolgreich erstellt
- [ ] Keine SQL-Fehler mehr

---

## 🐛 Fehlerbehandlung

### Fehler: "relation tenant_memberships does not exist"
**Lösung:** Schritt 1 noch nicht ausgeführt → `multi_tenant_setup.sql` ausführen

### Fehler: "null value in column tenant_id violates not-null constraint"
**Lösung:** Schritt 2 vergessen → User zu Tenant hinzufügen

### Fehler: "permission denied for table appointments"
**Lösung:** RLS Policies nicht korrekt → Schritt 1 nochmal ausführen

### Fehler: "column calendar_event_id does not exist"
**Lösung:** Schritt 3 noch nicht ausgeführt → `appointments_table_extended.sql` ausführen

---

## 🔄 Reset (falls etwas schief geht)

**⚠️ VORSICHT: Löscht alle Tenant-Daten!**

```sql
-- Nur in Development/Testing verwenden!
DROP TABLE IF EXISTS public.tenant_memberships CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- Dann von vorne: Schritt 1 ausführen
```

---

## 📊 Nützliche Queries nach Setup

```sql
-- Übersicht: Alle Tenants und ihre Mitglieder
SELECT 
  t.name as tenant,
  COUNT(tm.id) as members,
  STRING_AGG(tm.role, ', ') as roles
FROM public.tenants t
LEFT JOIN public.tenant_memberships tm ON t.id = tm.tenant_id
GROUP BY t.id, t.name;

-- Übersicht: Meine Tenants
SELECT * FROM public.get_user_tenants(auth.uid());

-- Übersicht: Termine mit Einladungsstatus
SELECT 
  a.starts_at,
  a.customer_email,
  a.meeting_type,
  CASE 
    WHEN a.invite_sent_at IS NOT NULL THEN '✅ Gesendet'
    ELSE '⏳ Ausstehend'
  END as invite_status,
  CASE 
    WHEN a.invite_accepted_at IS NOT NULL THEN '✅ Akzeptiert'
    WHEN a.invite_opened_at IS NOT NULL THEN '👀 Geöffnet'
    ELSE '⏳ Keine Reaktion'
  END as response_status
FROM public.appointments a
ORDER BY a.starts_at DESC
LIMIT 10;
```

---

## 🎉 Fertig!

Wenn alle Schritte erfolgreich waren, kannst du jetzt:
- ✅ Termine mit Kalendereinladungen erstellen
- ✅ n8n Workflow einrichten (siehe `n8n-calendar-automation-workflow.md`)
- ✅ Frontend-Component nutzen (`EnhancedAppointmentForm`)

**Nächster Schritt:** → `docs/calendar-automation-setup.md` für n8n & Frontend

