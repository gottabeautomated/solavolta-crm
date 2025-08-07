# Step 5.3: Map-Refinements (Labels, Auto-Fit, Layout)

## 🎯 Ziel
Bedienbarkeit und Übersicht verbessern: Namens-Labels an Markern, automatisches Zoomen auf sichtbare Leads, saubere Control-Positionen.

## 📋 Checkliste
- [x] Toggle „Namen anzeigen“ – Labels unter Pins (Einzelmarker + Cluster)
- [x] Toggle „Auto-Fit“ – Karte zoomt auf aktuell gefilterte Leads
- [x] Panels neu positioniert (oben rechts Ansicht, unten rechts Fit/Reset)
- [x] Kein Doppel-Filter im rechten Panel (Filter nur links in Sidebar)

## 🧩 Umsetzung
- `MapView.tsx`:
  - State: `showLabels`, `autoFit`
  - Komponente `AutoFitBounds` (fitBounds über gefilterte Leads)
  - Controls: Ansicht oben rechts, `MapControls` unten rechts
- `LeadMarker.tsx`:
  - Optionales Label unter Marker (`showLabel`)
  - Quick-Menü inkl. „Navigation“ & „Profil öffnen“
- `ClusterMarker.tsx`:
  - DivIcon mit Namenslabel bei aktivem Toggle
  - Popup mit Quick-Menü, keine Navigation auf Marker-Klick

## 🧪 Tests
- [x] Labels sichtbar bei aktivem Toggle
- [x] Auto-Fit zoomt zu den sichtbaren Leads
- [x] Keine Überlappung der Panels

## ✅ Definition of Done
- [x] Toggles funktionieren und sind persistenzfrei (UI-State)
- [x] UX: mobile-freundliche Touch-Ziele
- [x] Keine Regressions in Liste/Detail

## Nächster Step
Step 6.1: n8n Geocoding-Workflow (Automationen)
