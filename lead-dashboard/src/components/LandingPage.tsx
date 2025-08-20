import React from 'react'
import { LoginForm } from './LoginForm'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              BeAutomated × SolaVolta Lead Management System
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Verwalten Sie Leads, Termine, Angebote und Kartenansichten – effizient, sicher und überall verfügbar.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="#login"
                className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Jetzt anmelden
              </a>
              <a href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                Mehr erfahren <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 border-t">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Status-Management</h3>
            <p className="mt-2 text-gray-600">Automatische Historie, Benachrichtigungen und Workflows.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Karten & Geocoding</h3>
            <p className="mt-2 text-gray-600">Leads auf der Karte, Clustering, Heatmap, Filter & Navigation.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Import & Angebote</h3>
            <p className="mt-2 text-gray-600">CSV-Import, Angebots-PDF Uploads und Kontextverwaltung.</p>
          </div>
        </div>
      </section>

      {/* Login Anchor */}
      <section id="login" className="bg-white border-t">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-md">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Anmeldung</h2>
              <p className="mt-2 text-sm text-gray-600">Mit E-Mail und Passwort anmelden.</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 text-center text-sm text-gray-500">
          <a href="#/impressum" className="hover:text-gray-700">Impressum</a>
          <span className="mx-3">·</span>
          <a href="#/datenschutz" className="hover:text-gray-700">Datenschutz</a>
          <span className="mx-3">·</span>
          <a href="#/agb" className="hover:text-gray-700">AGB</a>
        </div>
      </footer>
    </div>
  )
}


