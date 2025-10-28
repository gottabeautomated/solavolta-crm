# 📅 Google Calendar OAuth Setup

Diese Anleitung zeigt dir, wie du die Google Calendar Integration für deine App konfigurierst.

---

## 🎯 Übersicht

Die App kann automatisch:
- ✅ Termine im Google Calendar erstellen
- ✅ Kalendereinladungen an Kunden senden
- ✅ Termine mit Lead-Daten synchronisieren

---

## 🚀 Schritt 1: Google Cloud Project erstellen

### 1.1 Google Cloud Console öffnen
1. Gehe zu: https://console.cloud.google.com/
2. Melde dich mit deinem Google Account an
3. Klicke auf **"Create Project"** oder wähle ein existierendes Projekt

### 1.2 Projekt erstellen
- **Project Name:** `SolaVolta CRM`
- **Organization:** (optional)
- Klicke auf **"Create"**

---

## 🔑 Schritt 2: Google Calendar API aktivieren

### 2.1 API Library öffnen
1. Im linken Menü: **"APIs & Services"** → **"Library"**
2. Suche nach: **"Google Calendar API"**
3. Klicke auf **"Google Calendar API"**
4. Klicke auf **"Enable"**

---

## 🔐 Schritt 3: OAuth Consent Screen konfigurieren

### 3.1 Consent Screen erstellen
1. Gehe zu: **"APIs & Services"** → **"OAuth consent screen"**
2. Wähle **"External"** (für öffentliche App) oder **"Internal"** (nur für deine Organisation)
3. Klicke auf **"Create"**

### 3.2 App Information
Fülle folgende Felder aus:

```
App Name: SolaVolta CRM
User support email: deine@email.de
Developer contact email: deine@email.de
```

### 3.3 Scopes hinzufügen
1. Klicke auf **"Add or Remove Scopes"**
2. Wähle folgende Scopes:
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.events
   ```
3. Klicke auf **"Update"** → **"Save and Continue"**

### 3.4 Test Users (nur bei "External")
Falls du "External" gewählt hast:
1. Klicke auf **"Add Users"**
2. Füge deine Test-Email-Adressen hinzu
3. Klicke auf **"Save and Continue"**

---

## 🎫 Schritt 4: OAuth 2.0 Credentials erstellen

### 4.1 Credentials erstellen
1. Gehe zu: **"APIs & Services"** → **"Credentials"**
2. Klicke auf **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**

### 4.2 Application Type
1. Wähle **"Web application"**
2. Name: `SolaVolta CRM Web Client`

### 4.3 Authorized Redirect URIs
Füge folgende URLs hinzu:

**Für Entwicklung (localhost):**
```
http://localhost:5173/api/calendar/callback
http://localhost:3000/api/calendar/callback
```

**Für Production (Vercel):**
```
https://deine-app.vercel.app/api/calendar/callback
https://solavolta-crm.vercel.app/api/calendar/callback
```

4. Klicke auf **"Create"**

### 4.4 Client ID & Secret speichern
Nach dem Erstellen erhältst du:
- ✅ **Client ID:** `123456789-abcdefg.apps.googleusercontent.com`
- ✅ **Client Secret:** `GOCSPX-abcdefghijklmnop`

**⚠️ WICHTIG:** Speichere diese Werte sicher! Du brauchst sie im nächsten Schritt.

---

## 🔧 Schritt 5: Environment Variables konfigurieren

### 5.1 Lokale Entwicklung (.env.local)

Erstelle/Bearbeite die Datei `.env.local`:

```bash
# Google Calendar OAuth
VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/api/calendar/callback

# Google Calendar API (Service Account - optional für Backend)
GOOGLE_SERVICE_ACCOUNT_EMAIL=solavolta-crm@solavolta-crm.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 5.2 Production (Vercel)

1. Gehe zu: https://vercel.com/dashboard
2. Wähle dein Projekt: **solavolta-crm**
3. Gehe zu: **Settings** → **Environment Variables**
4. Füge hinzu:

| Name | Value |
|------|-------|
| `VITE_GOOGLE_CLIENT_ID` | `123456789-abcdefg.apps.googleusercontent.com` |
| `VITE_GOOGLE_CLIENT_SECRET` | `GOCSPX-abcdefghijklmnop` |
| `VITE_GOOGLE_REDIRECT_URI` | `https://solavolta-crm.vercel.app/api/calendar/callback` |

5. Klicke auf **"Save"**
6. **Redeploy** deine App

---

## 🧪 Schritt 6: Testen

### 6.1 OAuth Flow testen

1. **Starte die App** (lokal: `npm run dev`)
2. **Öffne einen Lead** in der Lead-Detail Ansicht
3. **Klicke auf "Termin vereinbaren"**
4. **Fülle das Formular aus:**
   - Datum & Uhrzeit
   - Meeting-Typ (Vor Ort / Online / Telefon)
   - Kunden-Email für Einladung
5. **Aktiviere "Kalendereinladung senden"**
6. **Klicke auf "Termin erstellen"**

### 6.2 Was sollte passieren:

1. ✅ **OAuth-Popup öffnet sich** (beim ersten Mal)
2. ✅ Du wirst aufgefordert dich mit Google anzumelden
3. ✅ Du erlaubst den Zugriff auf Google Calendar
4. ✅ **Termin wird erstellt** in der Datenbank
5. ✅ **Kalendereinladung** wird an Kunden gesendet
6. ✅ **Termin erscheint** in deinem Google Calendar

### 6.3 Debugging

**Falls OAuth nicht funktioniert:**

1. **Console öffnen** (F12)
2. Schaue nach Fehlermeldungen
3. Prüfe ob die Redirect URI korrekt ist
4. Prüfe ob die Client ID korrekt in `.env.local` ist

**Häufige Fehler:**

| Fehler | Lösung |
|--------|--------|
| `redirect_uri_mismatch` | Redirect URI in Google Console überprüfen |
| `invalid_client` | Client ID/Secret in .env überprüfen |
| `access_denied` | User muss Zugriff erlauben (OAuth Consent) |

---

## 📧 Schritt 7: Email-Templates (optional)

Falls du Email-Benachrichtigungen über **n8n** senden möchtest:

1. Siehe: `docs/n8n-calendar-automation-workflow.md`
2. Konfiguriere SMTP in n8n
3. Verwende die Templates aus: `docs/calendar-email-templates.md`

---

## 🔒 Sicherheit & Best Practices

### ✅ DO's:
- ✅ **Credentials niemals committen** (in .gitignore)
- ✅ **Environment Variables** für alle Secrets verwenden
- ✅ **OAuth Scopes minimieren** (nur Calendar, nicht alle Google APIs)
- ✅ **Consent Screen verifizieren** für Production

### ❌ DON'Ts:
- ❌ Client Secret im Frontend hardcoden
- ❌ Credentials in Git pushen
- ❌ Zu viele Scopes anfragen
- ❌ User ohne Consent Screen verwenden

---

## 🆘 Support & Troubleshooting

### Hilfreiche Links:
- [Google Calendar API Docs](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

### Kontakt:
Bei Problemen: wanna@beautomated.at

---

## ✅ Checkliste

Nach dem Setup solltest du folgendes haben:

- [ ] Google Cloud Project erstellt
- [ ] Google Calendar API aktiviert
- [ ] OAuth Consent Screen konfiguriert
- [ ] OAuth 2.0 Client ID erstellt
- [ ] Redirect URIs hinzugefügt
- [ ] Environment Variables gesetzt (lokal & Vercel)
- [ ] App neu gestartet/deployed
- [ ] OAuth Flow getestet
- [ ] Termin erfolgreich erstellt
- [ ] Kalendereinladung erhalten

---

🎉 **Fertig! Deine Kalender-Integration ist bereit!**

