# 🚀 Git Workflow Guide für Lead-Dashboard Projekt

## 1. Feature-Branch Workflow (für neue Steps)
```bash
# Auf develop wechseln und aktualisieren
git checkout develop
git pull origin develop

# Neuen Feature-Branch erstellen
git checkout -b feature/step-X-Y-beschreibung

# Änderungen umsetzen...

# Änderungen zum Commit vormerken
git add .

# Commit mit Konvention
git commit -m "feat(scope): kurze beschreibung"

# Branch ins Remote pushen
git push -u origin feature/step-X-Y-beschreibung
```

### Merge in develop, wenn Step fertig ist:
```bash
git checkout develop
git pull origin develop
git merge feature/step-X-Y-beschreibung
git push origin develop

# Branch lokal und remote löschen
git branch -d feature/step-X-Y-beschreibung
git push origin --delete feature/step-X-Y-beschreibung
```

---

## 2. Bugfix Workflow
```bash
git checkout develop
git pull origin develop

git checkout -b bugfix/kurze-beschreibung

# Fix umsetzen...
git add .
git commit -m "fix(scope): fehlerbeschreibung"
git push -u origin bugfix/kurze-beschreibung

# Merge wie bei Feature-Branch in develop
```

---

## 3. Release Workflow
```bash
git checkout develop
git pull origin develop

# Release-Branch erstellen
git checkout -b release/v1.0.0

# Letzte Tests/Fixes
git add .
git commit -m "chore(release): vorbereitungen für v1.0.0"

# Merge in main
git checkout main
git pull origin main
git merge release/v1.0.0
git push origin main

# Merge zurück in develop
git checkout develop
git merge release/v1.0.0
git push origin develop

# Tag setzen
git tag -a v1.0.0 -m "First production release"
git push origin v1.0.0

# Release-Branch löschen
git branch -d release/v1.0.0
git push origin --delete release/v1.0.0
```

---

## 4. Hotfix Workflow
```bash
git checkout main
git pull origin main

git checkout -b hotfix/kurze-beschreibung

# Fix umsetzen...
git add .
git commit -m "fix(scope): kritischer fehler behoben"
git push -u origin hotfix/kurze-beschreibung

# Merge in main
git checkout main
git merge hotfix/kurze-beschreibung
git push origin main

# Merge in develop
git checkout develop
git merge hotfix/kurze-beschreibung
git push origin develop

# Branch löschen
git branch -d hotfix/kurze-beschreibung
git push origin --delete hotfix/kurze-beschreibung
```

---

## 5. Commit-Konvention
Format:
```
<type>(scope): beschreibung
```

**Types:**
- feat = neues Feature
- fix = Bugfix
- chore = Wartung/Config
- docs = Dokumentation
- refactor = Code-Refactoring
- style = Formatierung

**Beispiele:**
```
feat(auth): login-komponente implementiert
fix(map): marker-popup zeigt falsche nummer
chore(deps): leaflet aktualisiert auf 1.9.4
```

---

## 6. Empfohlene Branch-Namen für Steps
- feature/step-1-1-project-init
- feature/step-1-2-base-config
- feature/step-2-1-login
- feature/step-2-2-auth-context
- feature/step-3-1-database
- feature/step-3-3-search-filter
- feature/step-4-1-map-view
- feature/step-4-2-lead-edit 