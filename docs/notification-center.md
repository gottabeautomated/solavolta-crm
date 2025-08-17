## Notification Center – Architektur, Nutzung und Erweiterung

### Überblick
Das Notification Center bündelt Benachrichtigungen mit Live-Updates, Snooze-Management, Smart-Aktionen und Deep-Links in spezifische Lead-Abschnitte. Die Glocke im Header öffnet ein Dropdown mit dem Center, inklusive Badge für ungelesene Meldungen.

### Datenmodell
- Tabelle: `public.notifications`
  - Basis: `id`, `user_id`, `tenant_id`, `type`, `title`, `message`, `read`, `created_at`
  - Neu (siehe `src/lib/notifications_enhanced.sql`):
    - `priority text` enum-like: `low | normal | high | critical` (Default `normal`)
    - `action_data_json jsonb` – flexible Aktionsdaten (z. B. `lead_id`, `efu_id`, `appointment_id`, `section`, `tel`, `kind`)
    - `snoozed_until timestamptz` – Unterdrücken bis Zeitpunkt
    - `category text` – freie Kategorisierung (z. B. `sla`, `system`, `general`)
    - `archived_at timestamptz` – für Auto-Cleanup/Archiv
  - Indizes für Performance: `user_id, tenant_id`, `snoozed_until`, `category`, `archived_at`

Auto-Cleanup (täglich per Scheduler empfohlen):
```sql
-- Funktion ist bereits definiert
select cron.schedule(
  'archive-notifications-daily',
  '0 3 * * *',
  $$select public.archive_old_notifications();$$
);
```

### Hook-API: `useNotifications`
Datei: `src/hooks/useNotifications.ts`
- State/Selektoren:
  - `notifications`: alle geladenen Meldungen (max. 50)
  - `active`: aktuell wirksam (ohne Snooze in der Zukunft)
  - `snoozed`: gesnoozte Meldungen
  - `unreadCount`, `loading`, `error`
- Methoden:
  - `fetchNotifications()` – neu laden
  - `createNotification(payload)` – anlegen (setzt `tenant_id`, `user_id` automatisch)
  - `markAsRead(id)`, `markAllAsRead()`
  - `snooze(id, preset, customISO?)` – Presets: `1h | 4h | tomorrow9 | nextweek | custom`
- Resilienz: Wenn `archived_at` (noch) fehlt, fällt der Hook automatisch auf Queries ohne Archiv-Filter zurück.
- Realtime: `postgres_changes` auf `public.notifications` (INSERT) zur Live-Aktualisierung.

### UI-Komponenten
- `src/components/NotificationCenter.tsx`
  - Tabs/Kategorien: Alle | SLA | Leads | System (heuristisch aus `type`/`category`)
  - Badge im Header (ungelesen)
  - Inline-Aktionen pro Notification: Snooze-Presets, „Als gelesen“, „Erledigt“, „Anrufen“, „Lead öffnen“
  - Bulk-Aktionen: „Alle als gelesen“, Bulk-Snooze (inkl. Custom-Zeit)
- `src/components/Layout.tsx`
  - Glocke toggelt das Notification Center-Dropdown

### Smart Actions & Routing
- EventBus: `src/lib/eventBus.ts`
  - `openLeadDetail(leadId, section?)` triggert globales Event `open-lead-detail`
- App-Integration: `src/App.tsx`
  - Listener navigiert ohne Reload in die Detailansicht (`LeadDetail`), `section` kann später zur Tab/Autofokus-Auswahl verwendet werden

Mapping „Erledigt“ (implementiert in `NotificationCenter`)
- `followup_due` + `action_data_json.efu_id`: EFU (`enhanced_follow_ups`) auf `completed_at=now()` setzen
- `appointment_reminder` + `appointment_id`: Termin (`appointments`) auf `status='completed'`
- `offer_overdue` ODER `sla_breach(kind='offer_overdue')` + `lead_id`: EFU `type='offer_followup'`, `priority='high'`, `due_date=today`
- `sla_breach(kind='contact_overdue')` + `lead_id`: EFU `type='call'`, `priority='high'`, `due_date=today`
- Anschließend: Notification auf „gelesen“

Deep-Link Sections (Key → Ziel)
- `status`, `appointments`, `offers`, `followups`

### Action-Context – empfohlene Payloads in `action_data_json`
Beispiele je Typ (Server/Worker beim Erzeugen setzen):
```json
// followup_due
{ "lead_id": "…", "efu_id": "…", "section": "followups" }

// appointment_reminder
{ "lead_id": "…", "appointment_id": "…", "section": "appointments" }

// sla_breach – Kontakt überfällig
{ "lead_id": "…", "kind": "contact_overdue", "section": "followups", "tel": "tel:+43…" }

// offer_overdue / sla_breach – Angebot überfällig
{ "lead_id": "…", "kind": "offer_overdue", "section": "offers" }
```

### Entwickler: Notifications erzeugen
Minimalbeispiel (Server/Edge/Worker):
```sql
insert into public.notifications
  (user_id, tenant_id, type, title, message, priority, category, action_data_json)
values
  (
    :user_id,
    :tenant_id,
    'followup_due',
    'Follow-up heute fällig',
    'Lead Müller: Rückruf einplanen',
    'high',
    'leads',
    jsonb_build_object('lead_id', :lead_id, 'efu_id', :efu_id, 'section', 'followups')
  );
```

### URL-Integration & Saved Views (Kontext)
- Aktiver Saved-View wird in der URL als `?view=slug` gespiegelt (siehe `useSavedViews`). Kein Reload nötig.

### Erweiterungen (Roadmap)
- User-Preferences (`notification_preferences`): Typen an/aus, DND (`dnd_from`, `dnd_to`)
- Team-Eskalation: Bei `critical` + ungelesen > X Minuten → Admin-Hinweis
- „Als erledigt“ kann optional Lead-Status anpassen (Mapping projektabhängig)

### Troubleshooting
- 400/42703 bei `archived_at`: SQL-Script `notifications_enhanced.sql` ausführen; Hook fällt bis dahin automatisch zurück
- Realtime in Dev nicht sichtbar: Hard-Reload, Session prüfen


