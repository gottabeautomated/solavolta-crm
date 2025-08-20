import { supabase } from './supabase'

export type InvitationRole = 'owner' | 'admin' | 'agent' | 'viewer'

export interface InvitationData {
  tenant_id: string
  email: string
  role: InvitationRole
  tenant_name: string
}

export interface SendInvitationResult {
  invitationId: string
  token: string
}

export class InvitationError extends Error {
  public causeError?: unknown
  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'InvitationError'
    this.causeError = cause
  }
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)
}

function isValidEmail(value: string): boolean {
  // minimal email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/**
 * Erstellt eine Einladung in der Datenbank und triggert optional einen n8n-Webhook
 * für den E-Mail-Versand.
 */
export async function sendInvitation(input: InvitationData): Promise<SendInvitationResult> {
  // Basic input validation
  if (!isValidUuid(input.tenant_id)) {
    throw new InvitationError('Ungültige tenant_id')
  }
  if (!isValidEmail(input.email)) {
    throw new InvitationError('Ungültige E-Mail-Adresse')
  }
  if (!input.tenant_name || input.tenant_name.trim().length === 0) {
    throw new InvitationError('tenant_name ist erforderlich')
  }

  const allowedRoles: InvitationRole[] = ['owner', 'admin', 'agent', 'viewer']
  if (!allowedRoles.includes(input.role)) {
    throw new InvitationError(`Ungültige Rolle: ${input.role}`)
  }

  // Aktuellen Nutzer ermitteln
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) {
    throw new InvitationError('Konnte aktuellen Benutzer nicht laden', userErr)
  }
  const currentUser = userData.user
  if (!currentUser) {
    throw new InvitationError('Kein authentifizierter Benutzer')
  }

  const invitedByUserId = currentUser.id
  const invitedByEmail = currentUser.email ?? 'unknown'

  // Token generieren
  const token = crypto.randomUUID()

  // Einladung erstellen
  const { data: insertData, error: insertErr } = await supabase
    .from('invitations')
    .insert([
      {
        tenant_id: input.tenant_id,
        email: input.email,
        role: input.role,
        token,
        invited_by: invitedByUserId,
      },
    ])
    .select('id')
    .single()

  if (insertErr) {
    throw new InvitationError('Einladung konnte nicht gespeichert werden', insertErr)
  }

  const invitationId = insertData?.id as string
  if (!invitationId) {
    throw new InvitationError('Einladung gespeichert, aber keine ID erhalten')
  }

  // n8n Webhook (optional)
  const webhookUrl = (import.meta as any)?.env?.VITE_INVITE_WEBHOOK_URL as string | undefined
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: input.tenant_id,
          tenant_name: input.tenant_name,
          email: input.email,
          role: input.role,
          token,
          invited_by: invitedByEmail,
        }),
      })
      if (!res.ok) {
        // E-Mail-Versand ist wünschenswert, aber DB-Eintrag existiert bereits
        if (import.meta.env.DEV) console.error(`Invite webhook returned ${res.status}`)
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Invite webhook call failed', err)
    }
  } else {
    if (import.meta.env.DEV) console.warn('VITE_INVITE_WEBHOOK_URL ist nicht gesetzt – E-Mail wird nicht versendet')
  }

  return { invitationId, token }
}


