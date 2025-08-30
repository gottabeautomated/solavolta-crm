# BeAutomated × SolaVolta Lead-Dashboard

## Schnellstart (lokal)

1) Abhängigkeiten installieren
```bash
npm install
```

2) Env-Datei `.env.local` im Ordner `lead-dashboard/` anlegen
```dotenv
VITE_SUPABASE_URL=https://<dein-projekt>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-aus-supabase>
VITE_APP_VERSION=dev
```

3) Dev-Server starten
```bash
npm run dev
```

Hinweis: Falls beim Start die Meldung „App konnte nicht starten – VITE_SUPABASE_URL/ANON_KEY fehlen“ erscheint, ist die `.env.local` nicht gesetzt oder der Dev-Server muss nach dem Anlegen neu gestartet werden.
