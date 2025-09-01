import React, { useMemo, useState } from 'react'

type TabId =
  | 'quick-start'
  | 'workflow'
  | 'kontakt'
  | 'termine'
  | 'dashboard'
  | 'listen'
  | 'angebote'
  | 'troubleshooting'
  | 'glossar'

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <h2 className="text-2xl font-semibold text-slate-800 mb-4 pb-2 border-b-4 border-blue-500">
    {title}
  </h2>
)

const SubTitle: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-3 pl-3 border-l-4 border-rose-500">
    {title}
  </h3>
)

const Card: React.FC<{ title: string; children: React.ReactNode; accent?: 'green' | 'amber' | 'blue' }>
  = ({ title, children, accent = 'green' }) => (
  <div
    className={[
      'rounded-lg p-4 transition-transform border-l-4',
      accent === 'green' && 'bg-gradient-to-br from-slate-50 to-slate-100 border-green-500',
      accent === 'amber' && 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-500',
      accent === 'blue' && 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500',
    ].filter(Boolean).join(' ')}
  >
    <h4 className="text-base font-semibold text-slate-700 mb-1">{title}</h4>
    <div className="text-sm text-slate-700">{children}</div>
  </div>
)

const CodeBlock: React.FC<{ children: React.ReactNode }>
  = ({ children }) => (
  <pre className="bg-slate-800 text-slate-100 rounded-lg p-4 text-sm overflow-x-auto relative">
    <span className="absolute right-3 top-2 text-xs bg-rose-600 text-white px-2 py-0.5 rounded-full">Code</span>
    {children}
  </pre>
)

const Table: React.FC<{ headers: string[]; rows: React.ReactNode[][] }>
  = ({ headers, rows }) => (
  <div className="overflow-x-auto my-3">
    <table className="w-full border-collapse rounded-lg overflow-hidden shadow">
      <thead>
        <tr className="bg-slate-700 text-white">
          {headers.map((h) => (
            <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white">
        {rows.map((r, i) => (
          <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
            {r.map((c, j) => (
              <td key={j} className="px-4 py-3 text-slate-700">{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

type StatusKey =
  | 'new'
  | 'not-reached-1'
  | 'not-reached-2'
  | 'not-reached-3'
  | 'reached'
  | 'in-progress'
  | 'appointment'
  | 'not-interested'
  | 'offer-requested'
  | 'offer-created'
  | 'won'
  | 'lost'
  | 'paused'
  | 'duplicate'

const STATUS_DETAILS: Record<StatusKey, { title: string; content: React.ReactNode }> = {
  'new': {
    title: '🆕 Status: Neu',
    content: (
      <div>
        <h5 className="text-blue-600 font-semibold mt-2 mb-1">Beschreibung</h5>
        <p>Frisch eingegangener Lead, noch kein Kontakt hergestellt.</p>
        <h5 className="text-blue-600 font-semibold mt-3 mb-1">SLA & Automatisierung</h5>
        <ul className="list-disc ml-6 text-sm space-y-1">
          <li>SLA: Erstkontakt binnen 24 Stunden</li>
          <li>Auto‑EFU: Erstkontakt für heute</li>
          <li>Priorität: Hoch bis zur ersten Kontaktaufnahme</li>
        </ul>
      </div>
    )
  },
  'not-reached-1': {
    title: '📞 Status: Nicht erreicht (1x)',
    content: (
      <div>
        <h5 className="text-blue-600 font-semibold mt-2 mb-1">Beschreibung</h5>
        <p>Erster Kontaktversuch war nicht erfolgreich.</p>
        <h5 className="text-blue-600 font-semibold mt-3 mb-1">SLA & Automatisierung</h5>
        <ul className="list-disc ml-6 text-sm space-y-1">
          <li>Auto‑EFU: +1 Arbeitstag</li>
          <li>Dokumentation: Grund für Nichterreichbarkeit</li>
          <li>Optionen: Mailbox, Telefon aus, kein Anschluss</li>
        </ul>
      </div>
    )
  },
  'not-reached-2': {
    title: '📞❌ Status: Nicht erreicht (2x)',
    content: (
      <div>
        <h5 className="text-blue-600 font-semibold mt-2 mb-1">Beschreibung</h5>
        <p>Zweiter Kontaktversuch erfolglos. Erhöhte Aufmerksamkeit erforderlich.</p>
        <h5 className="text-blue-600 font-semibold mt-3 mb-1">Automatisierung</h5>
        <ul className="list-disc ml-6 text-sm space-y-1">
          <li>Auto‑EFU: +6 Arbeitstage</li>
          <li>Team‑Benachrichtigung</li>
          <li>Strategie‑Review</li>
        </ul>
      </div>
    )
  },
  'not-reached-3': {
    title: '🚨 Status: Nicht erreicht (3x)',
    content: (
      <div>
        <h5 className="text-blue-600 font-semibold mt-2 mb-1">Automatische Eskalation</h5>
        <ul className="list-disc ml-6 text-sm space-y-1">
          <li>Kunden‑E‑Mail via Webhook</li>
          <li>Teamleiter‑Info</li>
          <li>Alternative Strategie prüfen</li>
        </ul>
      </div>
    )
  },
  'reached': {
    title: '✅ Status: Erreicht',
    content: (
      <div>
        <h5 className="text-blue-600 font-semibold mt-2 mb-1">Nächste Schritte</h5>
        <ul className="list-disc ml-6 text-sm space-y-1">
          <li>Termin vereinbaren</li>
          <li>Angebot anfragen</li>
          <li>In Bearbeitung fortführen</li>
        </ul>
      </div>
    )
  },
  'in-progress': {
    title: '🔄 Status: In Bearbeitung',
    content: (
      <div>
        <p>Lead befindet sich in aktiver Bearbeitung, weitere Schritte erforderlich.</p>
      </div>
    )
  },
  'appointment': {
    title: '📅 Status: Termin vereinbart',
    content: (
      <div>
        <ul className="list-disc ml-6 text-sm space-y-1">
          <li>Webhook „Workflow starten“</li>
          <li>Kalender‑Eintrag</li>
          <li>Kunden‑Bestätigung</li>
          <li>Reminder am Vortag</li>
        </ul>
      </div>
    )
  },
  'not-interested': {
    title: '🚫 Status: Nicht interessiert',
    content: (
      <div>
        <p>Höfliche Ablehnung, optional Revival in 30 Tagen.</p>
      </div>
    )
  },
  'offer-requested': {
    title: '📋 Status: Angebot angefragt',
    content: (
      <div>
        <ul className="list-disc ml-6 text-sm space-y-1">
          <li>Deadline: 2 Arbeitstage</li>
          <li>Auto‑EFU „Angebot erstellen“</li>
          <li>Team‑Alert</li>
        </ul>
      </div>
    )
  },
  'offer-created': {
    title: '💼 Status: Angebot erstellt',
    content: (
      <div>
        <ul className="list-disc ml-6 text-sm space-y-1">
          <li>Nachfassen +3 / +7 Arbeitstage</li>
          <li>Betragsextraktion aus PDF</li>
          <li>Pipeline‑Update</li>
        </ul>
      </div>
    )
  },
  'won': {
    title: '🎉 Status: Gewonnen',
    content: (
      <div>
        <p>Projekt‑Webhook, Umsatzverbuchung, Team‑Benachrichtigung.</p>
      </div>
    )
  },
  'lost': {
    title: '❌ Status: Verloren',
    content: (
      <div>
        <p>Gründe dokumentieren, Revival‑EFU in 30 Tagen.</p>
      </div>
    )
  },
  'paused': {
    title: '⏸️ Status: Pausiert',
    content: (
      <div>
        <p>Keine EFUs bis Stichtag, Auto‑Reaktivierung am Zieldatum.</p>
      </div>
    )
  },
  'duplicate': {
    title: '📋 Status: Dublette',
    content: (
      <div>
        <p>Archivieren, Verweis auf Master‑Lead, Daten‑Merge.</p>
      </div>
    )
  },
}

const StatusNode: React.FC<{ label: string; color: string; onClick: () => void; pulse?: boolean }>
  = ({ label, color, onClick, pulse }) => (
  <button
    onClick={onClick}
    className={[
      'rounded-xl px-3 py-2 text-white font-semibold shadow hover:shadow-md transition-transform',
      'min-w-[140px] text-sm hover:-translate-y-0.5',
      color,
      pulse ? 'animate-pulse' : ''
    ].join(' ')}
  >
    {label}
  </button>
)

export function DocsPage() {
  const [active, setActive] = useState<TabId>('quick-start')
  const [selectedStatus, setSelectedStatus] = useState<StatusKey | null>(null)

  const tabs = useMemo(
    () => [
      { id: 'quick-start', label: '🚀 Quick Start' },
      { id: 'workflow', label: '🔄 Lead-Workflow' },
      { id: 'kontakt', label: '📞 Kontakt' },
      { id: 'termine', label: '📅 Termine' },
      { id: 'dashboard', label: '📊 Dashboard & KPIs' },
      { id: 'listen', label: '📋 Listen & Karte' },
      { id: 'angebote', label: '💰 Angebote' },
      { id: 'troubleshooting', label: '🔧 Fehler' },
      { id: 'glossar', label: '📚 Glossar' },
    ] as { id: TabId; label: string }[],
    []
  )

  return (
    <div className="rounded-lg overflow-hidden border bg-white">
      <div className="bg-gradient-to-br from-slate-800 to-blue-600 text-white p-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold">🌞 SolaVolta CRM</h1>
        <p className="opacity-90">Benutzerhandbuch – Stand {new Date().toLocaleDateString('de-DE')}</p>
      </div>

      <div className="bg-slate-700 p-3 sticky top-0 z-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={[
                'px-4 py-2 rounded-full text-sm font-medium transition',
                active === t.id
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-slate-800 text-white hover:bg-blue-500'
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto">
        {active === 'quick-start' && (
          <div>
            <SectionTitle title="🚀 Quick Start" />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-4">
              <Card title="🆕 Neuen Lead erfassen">
                Lead-Daten eingeben, Status „Neu“. Follow-up für heute wird automatisch angelegt.
              </Card>
              <Card title="📞 Lead kontaktieren">
                Dashboard → „Heute kontaktieren“ → Lead öffnen → Telefonversuch dokumentieren.
              </Card>
              <Card title="📅 Termin vereinbaren">
                Erreicht → „Termin vereinbaren“ → Datum/Zeit/Kanal wählen → optional Webhook starten.
              </Card>
              <Card title="💰 Angebot erstellen">
                Status „Angebot angefragt“ setzen, Datei hochladen, Betrag wird automatisch erkannt.
              </Card>
            </div>

            <SubTitle title="Navigation im System" />
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl font-bold">📊</div>
                <div>Dashboard</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl font-bold">👥</div>
                <div>Leads</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl font-bold">🗺️</div>
                <div>Karte</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl font-bold">📄</div>
                <div>Angebote</div>
              </div>
            </div>
          </div>
        )}

        {active === 'workflow' && (
          <div>
            <SectionTitle title="🔄 Lead‑Workflow" />
            <SubTitle title="Quellen der Wahrheit" />
            <Table
              headers={["Datenquelle", "Beschreibung", "Zweck"]}
              rows={[
                [<code key="l">leads</code>, 'Stammdaten und aktueller Status', 'Hauptdatenbank'],
                [<code key="a">appointments</code>, 'Alle Termine mit Webhook‑Integration', 'Terminplanung'],
                [<code key="e">enhanced_follow_ups</code>, 'Automatisierte Wiedervorlagen', 'Nachfassautomatisierung'],
                [<code key="c">contact_attempts</code>, 'Vollständiges Kontaktprotokoll', 'Dokumentation'],
              ]}
            />

            <SubTitle title="Status‑Workflow" />
            <div className="bg-slate-50 rounded-lg p-4 overflow-x-auto">
              <div className="flex items-center gap-2 min-w-[900px]">
                <div className="px-3 py-2 rounded bg-blue-600 text-white font-semibold">Neu</div>
                <span>→</span>
                <div className="px-3 py-2 rounded bg-amber-500 text-white font-semibold">Nicht erreicht 1x/2x/3x</div>
                <span>→</span>
                <div className="px-3 py-2 rounded bg-emerald-600 text-white font-semibold">In Bearbeitung</div>
                <span>→</span>
                <div className="px-3 py-2 rounded bg-violet-600 text-white font-semibold">Termin vereinbart</div>
                <span>→</span>
                <div className="px-3 py-2 rounded bg-orange-600 text-white font-semibold">Angebot erstellt</div>
                <span>→</span>
                <div className="px-3 py-2 rounded bg-green-600 text-white font-semibold">Gewonnen</div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-amber-50 border-l-4 border-amber-500 p-4">
              <h4 className="font-semibold mb-2">⚡ SLA‑Zeiten</h4>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>Erstkontakt: binnen 24h</li>
                <li>Angebot: binnen 2 Arbeitstagen</li>
                <li>Nachfassen: +3 und +7 Arbeitstage</li>
                <li>Revival: 30 Tage nach „Verloren“</li>
              </ul>
            </div>

            <SubTitle title="Interaktive Visualisierung" />
            <div className="mt-2 grid gap-4 lg:grid-cols-[2fr_1fr]">
              {/* Workflow Diagram */}
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                {/* Eingang */}
                <div className="mb-3">
                  <div className="text-center font-semibold text-slate-700 mb-2">📥 Eingang</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <StatusNode label="Neu" color="bg-blue-600" onClick={() => setSelectedStatus('new')} />
                  </div>
                </div>

                <div className="flex flex-col items-center my-2 text-slate-400">
                  <div className="text-2xl leading-none">↓</div>
                  <div className="text-xs italic">Erstkontakt</div>
                </div>

                {/* Kontakt */}
                <div className="mb-3">
                  <div className="text-center font-semibold text-slate-700 mb-2">📞 Kontakt</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <StatusNode label="Nicht erreicht 1x" color="bg-amber-500" onClick={() => setSelectedStatus('not-reached-1')} />
                      <div className="text-slate-300">↓</div>
                      <StatusNode label="Nicht erreicht 2x" color="bg-amber-600" onClick={() => setSelectedStatus('not-reached-2')} />
                      <div className="text-slate-300">↓</div>
                      <StatusNode label="Nicht erreicht 3x" color="bg-orange-600" onClick={() => setSelectedStatus('not-reached-3')} pulse />
                    </div>
                    <StatusNode label="Erreicht" color="bg-emerald-600" onClick={() => setSelectedStatus('reached')} />
                  </div>
                </div>

                <div className="flex flex-col items-center my-2 text-slate-400">
                  <div className="text-2xl leading-none">↓</div>
                  <div className="text-xs italic">Gespräch geführt</div>
                </div>

                {/* Qualifikation */}
                <div className="mb-3">
                  <div className="text-center font-semibold text-slate-700 mb-2">🎯 Qualifikation</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <StatusNode label="In Bearbeitung" color="bg-emerald-600" onClick={() => setSelectedStatus('in-progress')} />
                    <StatusNode label="Termin vereinbart" color="bg-violet-600" onClick={() => setSelectedStatus('appointment')} />
                    <StatusNode label="Nicht interessiert" color="bg-slate-500" onClick={() => setSelectedStatus('not-interested')} />
                  </div>
                </div>

                <div className="flex flex-col items-center my-2 text-slate-400">
                  <div className="text-2xl leading-none">↓</div>
                  <div className="text-xs italic">Bedarf konkretisiert</div>
                </div>

                {/* Angebot */}
                <div className="mb-3">
                  <div className="text-center font-semibold text-slate-700 mb-2">💰 Angebot</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <StatusNode label="Angebot angefragt" color="bg-orange-500" onClick={() => setSelectedStatus('offer-requested')} />
                    <StatusNode label="Angebot erstellt" color="bg-orange-600" onClick={() => setSelectedStatus('offer-created')} />
                  </div>
                </div>

                <div className="flex flex-col items-center my-2 text-slate-400">
                  <div className="text-2xl leading-none">↓</div>
                  <div className="text-xs italic">Entscheidung</div>
                </div>

                {/* Abschluss */}
                <div className="mb-3">
                  <div className="text-center font-semibold text-slate-700 mb-2">🎯 Abschluss</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <StatusNode label="Gewonnen" color="bg-green-600" onClick={() => setSelectedStatus('won')} />
                    <StatusNode label="Verloren" color="bg-slate-400" onClick={() => setSelectedStatus('lost')} />
                  </div>
                </div>

                {/* Sonderstatus */}
                <div className="mb-1">
                  <div className="text-center font-semibold text-slate-700 mb-2">⏸️ Sonder‑Status</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <StatusNode label="Pausiert" color="bg-blue-500" onClick={() => setSelectedStatus('paused')} />
                    <StatusNode label="Dublette" color="bg-slate-600" onClick={() => setSelectedStatus('duplicate')} />
                  </div>
                </div>
              </div>

              {/* Detail Panel */}
              <div className="rounded-xl bg-white border shadow p-4 sticky top-4 h-fit max-h-[65vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 mb-2 border-b">
                  <h4 className="font-semibold text-slate-800 m-0">
                    {selectedStatus ? STATUS_DETAILS[selectedStatus].title : 'Status Details'}
                  </h4>
                  {selectedStatus && (
                    <button
                      className="px-2 py-1 rounded bg-rose-600 text-white text-xs"
                      onClick={() => setSelectedStatus(null)}
                    >
                      Schließen
                    </button>
                  )}
                </div>
                <div className="text-sm text-slate-700">
                  {selectedStatus ? (
                    STATUS_DETAILS[selectedStatus].content
                  ) : (
                    <p>Klicke in der Visualisierung auf einen Status, um Details zu sehen.</p>
                  )}
                </div>
              </div>
            </div>

            <SubTitle title="Workflow‑Metriken" />
            <div className="grid gap-3 md:grid-cols-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl font-bold">7.5 Tage</div>
                <div className="text-sm opacity-90">Durchschnittliche Lead‑Zeit</div>
              </div>
              <div className="bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl font-bold">25%</div>
                <div className="text-sm opacity-90">Gesamt‑Conversion</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl font-bold">3.2x</div>
                <div className="text-sm opacity-90">Kontaktversuche Ø</div>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl font-bold">€47.500</div>
                <div className="text-sm opacity-90">Ø Deal‑Wert</div>
              </div>
            </div>
          </div>
        )}

        {active === 'kontakt' && (
          <div>
            <SectionTitle title="📞 Kontaktprozess & Automatisierung" />
            <SubTitle title="Enhanced Follow‑ups (EFU)" />
            <Table
              headers={["Status", "Follow‑up Typ", "Zeitraum", "Auto"]}
              rows={[
                ['Neu', 'Erstkontakt', 'Heute', '✅'],
                ['Nicht erreicht 1x', 'Kontaktversuch', '+1 Arbeitstag', '✅'],
                ['Nicht erreicht 2x', 'Kontaktversuch', '+6 Arbeitstage', '✅'],
                ['Nicht erreicht 3x', 'E‑Mail + Anruf', '+10 Arbeitstage', '✅'],
                ['Termin vereinbart', 'Reminder', '1 Tag vorher', '✅'],
              ]}
            />

            <div className="rounded-lg bg-emerald-50 border-l-4 border-emerald-500 p-4 mt-4">
              <h4 className="font-semibold mb-2">🎯 „Heute kontaktieren“ – Regeln</h4>
              <ul className="list-disc ml-6 text-sm space-y-1">
                <li>Status „Neu“ mit Follow‑up heute/überfällig</li>
                <li>Status „Nicht erreicht“ mit fälligem Follow‑up</li>
                <li>Status „In Bearbeitung“ mit Terminen heute</li>
                <li>Alle EFUs vom Typ „Kontaktversuch“ oder „Nachfassen“</li>
              </ul>
            </div>

            <SubTitle title="Telefonversuch Szenarien" />
            <CodeBlock>
{`# Nicht erreicht
Optionen: "Mailbox" | "Telefon aus"
→ Zähler erhöhen
→ Nächstes Follow‑up planen
→ Kontaktprotokoll‑Eintrag

# Erreicht – Termin vereinbaren
Datum + Uhrzeit + Kanal
Webhook optional starten

# Erreicht – Angebot angefragt
Status setzen, Follow‑up "Angebot erstellen" (2 Tage)
Team informieren`}
            </CodeBlock>
          </div>
        )}

        {active === 'termine' && (
          <div>
            <SectionTitle title="📅 Termine & Kalenderintegration" />
            <SubTitle title="Termin‑Erstellung" />
            <div className="grid gap-3 md:grid-cols-3">
              <Card title="📞 Telefon‑Termin">Klassisches Telefonat zu fester Zeit.</Card>
              <Card title="📹 Video‑Call">Online‑Meeting mit Bildschirmteilung.</Card>
              <Card title="🏠 Vor‑Ort‑Termin">Persönlicher Besuch beim Kunden.</Card>
            </div>

            <div className="mt-4 rounded-lg bg-rose-50 border-l-4 border-rose-500 p-4">
              <h4 className="font-semibold mb-2">⚙️ Webhook‑Integration</h4>
              <ul className="list-disc ml-6 text-sm space-y-1">
                <li>Workflow triggern</li>
                <li>Kalenderintegration (falls konfiguriert)</li>
                <li>Bestätigungs‑E‑Mail</li>
                <li>Reminder am Vortag</li>
              </ul>
            </div>

            <SubTitle title="Retry‑Logic" />
            <CodeBlock>
{`Primary: Webhook‑URL
Fallback: Interne Benachrichtigung
Retries: 3 Versuche mit Backoff (0, 5, 15 Minuten)`}
            </CodeBlock>
          </div>
        )}

        {active === 'dashboard' && (
          <div>
            <SectionTitle title="📊 Dashboard & KPIs" />
            <SubTitle title="Übersichtskacheln" />
            <div className="grid gap-3 md:grid-cols-4">
              <div className="bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl">🔴</div>
                <div>Überfällig</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl">🟡</div>
                <div>Heute fällig</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl">🟢</div>
                <div>SLA eingehalten</div>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg p-4 text-center shadow">
                <div className="text-2xl">💰</div>
                <div>Offene Angebote</div>
              </div>
            </div>

            <SubTitle title="Geschäftskennzahlen" />
            <Table
              headers={["KPI", "Berechnung", "Aktualisierung"]}
              rows={[
                ['Conversion 30d', <code key="rpc">v_sales_kpis_30</code>, 'Echtzeit'],
                ['Offers‑Wert', 'Summe aus offers[].amount', 'Echtzeit'],
                ['Gewonnen‑Wert 30d', 'Summe Status „Gewonnen“ 30 Tage', 'Täglich'],
                ['SLA Kontakt >24h', 'Ampelsystem nach Erstkontakt', 'Stündlich'],
              ]}
            />
          </div>
        )}

        {active === 'listen' && (
          <div>
            <SectionTitle title="📋 Listen & Kartenansicht" />
            <SubTitle title="Lead‑Liste Features" />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card title="🔍 Inline‑Status‑Änderung">Direkt in der Liste anpassen.</Card>
              <Card title="🔎 Erweiterte Suche">Name, Telefon, Adresse, PLZ.</Card>
              <Card title="📊 Multi‑Filter">Status, Priorität, Zeitraum.</Card>
              <Card title="📁 Archiv">„Archiviert“-Badge, standardmäßig ausgeblendet.</Card>
            </div>

            <SubTitle title="Kartenansicht – Farbcodierung" />
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                ['Neu', 'bg-blue-600'],
                ['Nicht erreicht', 'bg-amber-500'],
                ['In Bearbeitung', 'bg-emerald-600'],
                ['Termin vereinbart', 'bg-violet-600'],
                ['Angebot erstellt', 'bg-orange-600'],
                ['Gewonnen', 'bg-green-600'],
                ['Verloren', 'bg-slate-400'],
              ].map(([label, cls]) => (
                <span key={label as string} className={["text-white px-3 py-1 rounded-full text-sm font-semibold", cls as string].join(' ')}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {active === 'angebote' && (
          <div>
            <SectionTitle title="💰 Angebotsverwaltung" />
            <SubTitle title="Storage‑System" />
            <Table
              headers={["Bucket", "Inhalt", "Formate"]}
              rows={[
                [<code key="o">offers</code>, 'Standard‑Angebote', 'PDF, DOCX'],
                [<code key="t">tvp</code>, 'Technische Vorplanung', 'CAD, Spezial'],
              ]}
            />

            <SubTitle title="Automatische Betragsextraktion" />
            <CodeBlock>
{`Edge Function: offer-parse
1) Dateiname: Angebot_2024_15000_Euro.pdf → 15000
2) PDF‑Text: OCR/Regex
3) Fallback: Manuelle Eingabe

Update schreibt offers[].amount UND offer_amount (idempotent)`}
            </CodeBlock>

            <SubTitle title="JSON‑Integration" />
            <CodeBlock>
{`{
  "offers": [
    {
      "typ": "Standard",
      "datum": "2024-03-15",
      "nummer": "ANB-2024-001",
      "bucket": "offers",
      "pfad": "kunde_2024/angebot_15000.pdf",
      "betrag": 15000.00
    }
  ]
}`}
            </CodeBlock>
          </div>
        )}

        {active === 'troubleshooting' && (
          <div>
            <SectionTitle title="🔧 Fehlerbehebung" />
            <div className="rounded-lg bg-rose-50 border-l-4 border-rose-500 p-4">
              <h4 className="font-semibold mb-2">❌ Views mit SECURITY INVOKER</h4>
              <CodeBlock>
{`DROP VIEW IF EXISTS lead_with_details CASCADE;
CREATE VIEW lead_with_details WITH (security_invoker=true) AS ...`}
              </CodeBlock>
            </div>

            <div className="rounded-lg bg-amber-50 border-l-4 border-amber-500 p-4 mt-4">
              <h4 className="font-semibold mb-2">🔄 pgrst Schema Reload</h4>
              <CodeBlock>
{`# PostgREST Schema-Cache aktualisieren
curl -X POST "<api-url>/rpc/pgrst_reload_schema"`}
              </CodeBlock>
            </div>

            <SubTitle title="Migration & Cleanup" />
            <CodeBlock>
{`CREATE TABLE leads_backup AS SELECT * FROM leads;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='old_field'
  ) THEN
    ALTER TABLE leads DROP COLUMN old_field;
  END IF;
END $$;`}
            </CodeBlock>
          </div>
        )}

        {active === 'glossar' && (
          <div>
            <SectionTitle title="📚 Glossar" />
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['EFU', 'Enhanced Follow‑Up – automatisierte Wiedervorlage'],
                ['SLA', 'Service Level Agreement – definierte Reaktionszeiten'],
                ['RPC', 'Remote Procedure Call – DB‑Funktionen'],
                ['RLS', 'Row Level Security – Mandantenisolation'],
                ['Tenant', 'Mandant – abgegrenzter Datenbereich'],
                ['Webhook', 'HTTP‑Callback für Integrationen'],
                ['Backfill', 'Nachträgliche Datenbefüllung'],
                ['SECURITY INVOKER', 'View nutzt Rechte des Aufrufenden'],
              ].map(([t, d]) => (
                <div key={t as string} className="bg-slate-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="font-semibold text-slate-800">{t}</div>
                  <div className="text-sm text-slate-600">{d}</div>
                </div>
              ))}
            </div>

            <SubTitle title="Quick Reference" />
            <div className="bg-slate-50 rounded-lg p-4">
              <ol className="list-decimal ml-6 space-y-1 text-sm">
                <li>Dashboard öffnen → Überfällige/heutige Aufgaben prüfen</li>
                <li>„Heute kontaktieren“ systematisch abarbeiten</li>
                <li>Termine dokumentieren</li>
                <li>Angebote nachfassen</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



