import React from 'react'
import { LoginForm } from './LoginForm'

export function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            BeAutomated × SolaVolta Lead Management System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Bitte melden Sie sich an
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Development Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Entwicklungsumgebung - Jonas Login
          </p>
        </div>
      </div>
    </div>
  )
} 