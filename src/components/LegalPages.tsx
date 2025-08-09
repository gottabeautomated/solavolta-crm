import React from 'react'

const COMPANY_NAME = 'BeAutomated'
const COMPANY_ADDRESS = 'Seilergasse 4, 2221 Groß‑Schweinbarth, Österreich'
const COMPANY_EMAIL = 'wanna@beautomated.at'
const COMPANY_PHONE = '+43 664 138 38 00'

export function Impressum() {
  return (
    <div className="prose max-w-none">
      <div className="mb-4">
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault()
            window.location.hash = '#/'
          }}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zur Startseite
        </a>
      </div>
      <h2>Impressum</h2>
      <h3>Angaben gemäß § 5 ECG</h3>
      <p>
        <strong>{COMPANY_NAME}</strong>
        <br />
        {COMPANY_ADDRESS}
      </p>
      <p>
        <strong>Kontakt</strong>
        <br />
        E‑Mail: <a href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a>
        <br />
        Telefon: <a href={`tel:${COMPANY_PHONE.replace(/\s|\+/g, '')}`}>{COMPANY_PHONE}</a>
      </p>
      <p>
        <strong>Unternehmensangaben</strong>
        <br />
        Firmenbuchnummer / UID: —
        <br />
        Zuständige Behörde: —
      </p>
      <h3>Haftung für Inhalte</h3>
      <p>
        Wir erstellen die Inhalte dieser Website mit größter Sorgfalt. Für die Richtigkeit, Vollständigkeit und
        Aktualität der Inhalte können wir jedoch keine Haftung übernehmen.
      </p>
      <h3>Haftung für Links</h3>
      <p>
        Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für diese
        fremden Inhalte übernehmen wir keine Gewähr. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
        Anbieter oder Betreiber verantwortlich.
      </p>
      <h3>Urheberrecht</h3>
      <p>
        Die durch uns erstellten Inhalte und Werke auf diesen Seiten unterliegen dem Urheberrecht. Beiträge Dritter sind
        als solche gekennzeichnet. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb
        der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
      </p>
      <h3>Online‑Streitbeilegung</h3>
      <p>
        Verbraucher haben die Möglichkeit, Beschwerden an die Online‑Streitbeilegungsplattform der EU zu richten:
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">EU‑ODR Plattform</a>.
      </p>
    </div>
  )
}

export function Datenschutz() {
  return (
    <div className="prose max-w-none">
      <div className="mb-4">
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault()
            window.location.hash = '#/'
          }}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zur Startseite
        </a>
      </div>
      <h2>Datenschutzerklärung</h2>
      <h3>1. Verantwortlicher</h3>
      <p>
        Verantwortlich für die Verarbeitung personenbezogener Daten ist {COMPANY_NAME}, {COMPANY_ADDRESS}. Kontakt:
        <a href={`mailto:${COMPANY_EMAIL}`}> {COMPANY_EMAIL}</a>, Tel.
        <a href={`tel:${COMPANY_PHONE.replace(/\s|\+/g, '')}`}> {COMPANY_PHONE}</a>.
      </p>
      <h3>2. Zwecke und Rechtsgrundlagen</h3>
      <p>
        Wir verarbeiten personenbezogene Daten zur Bereitstellung und Nutzung des BeAutomated × SolaVolta Lead
        Management Systems, zur Vertragserfüllung und zur Kommunikation. Rechtsgrundlagen sind Art. 6 Abs. 1 lit. b
        (Vertrag), lit. f (berechtigte Interessen) und – soweit erforderlich – lit. a DSGVO (Einwilligung).
      </p>
      <h3>3. Verarbeitete Datenkategorien</h3>
      <p>
        Stammdaten (z. B. Name, Kontaktdaten), Kommunikationsdaten, Nutzungsdaten (Log‑Daten, IP, Zeitstempel), sowie
        in der App erfasste Geschäfts‑ und Vorgangsdaten (Leads, Termine, Angebote).
      </p>
      <h3>4. Empfänger</h3>
      <p>
        Dienstleister für Hosting, Betrieb, Speicherung und Support. Eine Übermittlung in Drittländer erfolgt nur bei
        Vorliegen geeigneter Garantien gem. Art. 44 ff. DSGVO (z. B. Standardvertragsklauseln).
      </p>
      <h3>5. Speicherdauer</h3>
      <p>
        Wir speichern Daten nur so lange, wie es für die jeweiligen Zwecke erforderlich ist oder gesetzliche Pflichten
        bestehen. Danach werden Daten gelöscht oder anonymisiert.
      </p>
      <h3>6. Betroffenenrechte</h3>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit
        und Widerspruch. Widerruf erteilter Einwilligungen ist jederzeit möglich. Bitte wenden Sie sich an die oben
        genannten Kontaktmöglichkeiten.
      </p>
      <h3>7. Sicherheitsmaßnahmen</h3>
      <p>
        Wir treffen angemessene technische und organisatorische Maßnahmen zur Sicherung der Daten gegen Verlust,
        Missbrauch und unbefugten Zugriff.
      </p>
      <h3>8. Server‑Logs und Cookies</h3>
      <p>
        Beim Aufruf der App können technisch notwendige Daten in Server‑Logs erfasst werden. Cookies setzen wir nur, so
        weit sie technisch erforderlich sind oder Sie eingewilligt haben.
      </p>
      <h3>9. Aufsichtsbehörde</h3>
      <p>
        Beschwerden können an die Österreichische Datenschutzbehörde gerichtet werden:
        <a href="https://www.dsb.gv.at" target="_blank" rel="noreferrer">www.dsb.gv.at</a>.
      </p>
      <p><em>Stand: {new Date().toLocaleDateString('de-AT')}</em></p>
    </div>
  )
}

export function AGB() {
  return (
    <div className="prose max-w-none">
      <div className="mb-4">
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault()
            window.location.hash = '#/'
          }}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zur Startseite
        </a>
      </div>
      <h2>Allgemeine Geschäftsbedingungen (AGB)</h2>
      <h3>1. Geltungsbereich</h3>
      <p>
        Diese AGB gelten für Bereitstellung und Nutzung des „BeAutomated × SolaVolta Lead Management Systems“ gegenüber
        Unternehmern und, soweit anwendbar, Verbrauchern. Abweichende Bedingungen gelten nur, wenn sie schriftlich
        bestätigt wurden.
      </p>
      <h3>2. Leistungsumfang</h3>
      <p>
        Bereitstellung einer webbasierten Anwendung zum Lead‑, Termin‑ und Angebotsmanagement inkl. optionaler
        Integrationen. Funktionsumfang ergibt sich aus der jeweils aktuellen Leistungsbeschreibung.
      </p>
      <h3>3. Nutzungsrechte</h3>
      <p>
        Es wird ein einfaches, nicht übertragbares Nutzungsrecht für die Vertragsdauer eingeräumt. Unzulässig sind
        Reverse Engineering, Weitergabe an Dritte oder Umgehung technischer Schutzmaßnahmen, soweit gesetzlich zulässig.
      </p>
      <h3>4. Verfügbarkeit und Wartung</h3>
      <p>
        Angemessene Verfügbarkeit und übliche Wartungsfenster. Geplante Wartungen werden – soweit möglich – vorab
        angekündigt.
      </p>
      <h3>5. Entgelte und Zahlung</h3>
      <p>
        Sofern Entgelte vereinbart sind, gelten die vertraglich festgelegten Preise. Alle Preise verstehen sich netto
        zzgl. gesetzlicher Steuern. Zahlungen sind mit Rechnungslegung fällig, sofern nichts anderes vereinbart ist.
      </p>
      <h3>6. Pflichten des Kunden</h3>
      <p>
        Der Kunde sorgt für richtige Angaben, Zugangsschutz, gesetzeskonforme Nutzung und die erforderlichen Rechte an
        eingestellten Inhalten.
      </p>
      <h3>7. Haftung</h3>
      <p>
        Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach zwingenden gesetzlichen Vorschriften. Im
        Übrigen ist die Haftung – soweit rechtlich zulässig – der Höhe nach auf den vertragstypischen, vorhersehbaren
        Schaden begrenzt.
      </p>
      <h3>8. Gewährleistung</h3>
      <p>
        Es gelten die gesetzlichen Gewährleistungsregeln. Bei Unternehmern besteht zunächst ein Recht auf Nachbesserung
        oder Ersatzlieferung.
      </p>
      <h3>9. Datenschutz</h3>
      <p>
        Es gilt die Datenschutzerklärung in ihrer jeweils aktuellen Fassung.
      </p>
      <h3>10. Vertraulichkeit</h3>
      <p>
        Parteien behandeln vertrauliche Informationen geheim, sofern keine gesetzliche Pflicht zur Offenlegung besteht.
      </p>
      <h3>11. Laufzeit und Kündigung</h3>
      <p>
        Sofern nicht anders vereinbart, läuft der Vertrag auf unbestimmte Zeit und kann unter Einhaltung vertraglicher
        Fristen ordentlich gekündigt werden. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt
        unberührt.
      </p>
      <h3>12. Schlussbestimmungen</h3>
      <p>
        Es gilt österreichisches Recht unter Ausschluss seiner Kollisionsnormen. Zwingende Verbraucherschutzvorschriften
        bleiben unberührt. Gerichtsstand im unternehmerischen Verkehr ist der Sitz von {COMPANY_NAME}.
      </p>
    </div>
  )
}



