// Deno Edge Function: Offer PDF parsing and amount extraction
// Input JSON: { bucket: 'offers'|'tvp', path: string, leadId: string, tenantId?: string }
// Behavior:
// 1) Create signed URL for the file
// 2) Download bytes and try to extract amount with heuristics
// 3) Update leads.offers[].amount where bucket+path matches
// 4) Also update leads.offer_amount if empty

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function parseAmountFromFilename(path: string): number | null {
  const clean = decodeURIComponent(path)
  const m = clean.match(/(\d{1,3}(?:[\.\s]\d{3})*(?:[\.,]\d{2})|\d{3,})/)
  if (!m) return null
  const raw = m[1].replace(/\s/g, '')
  const normalized = raw.replace(/\./g, '').replace(/,/g, '.')
  const val = Number(normalized)
  return Number.isFinite(val) ? val : null
}

function parseAmountFromText(text: string): number | null {
  const patterns = [
    /(gesamt(summe|betrag)|brutto|endsumme|summe)\D{0,40}?(\d{1,3}(?:[\.\s]\d{3})*(?:[\.,]\d{2})|\d{3,})/i,
    /(€)\s*(\d{1,3}(?:[\.\s]\d{3})*(?:[\.,]\d{2})|\d{3,})/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const candidate = (m[m.length - 1] || '').replace(/\s/g, '')
      const normalized = candidate.replace(/\./g, '').replace(/,/g, '.')
      const val = Number(normalized)
      if (Number.isFinite(val)) return val
    }
  }
  return null
}

async function extractAmount(bucket: string, path: string): Promise<number | null> {
  // try from filename first
  const byFile = parseAmountFromFilename(path)
  if (byFile && byFile > 0) return byFile

  // signed URL + fetch bytes
  const { data: signed, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60)
  if (signErr || !signed?.signedUrl) return null
  const res = await fetch(signed.signedUrl)
  if (!res.ok) return null
  const buf = new Uint8Array(await res.arrayBuffer())
  // naive text extract – works for many text PDFs (not scans)
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buf)
  const byText = parseAmountFromText(text)
  return byText
}

async function updateLeadOfferAmount(leadId: string, bucket: string, path: string, amount: number) {
  const { data: lead } = await supabase
    .from('leads')
    .select('id, offers, offer_amount')
    .eq('id', leadId)
    .single()
  if (!lead) return
  const offers: any[] = Array.isArray(lead.offers) ? lead.offers : []
  let found = false
  const next = offers.map((o) => {
    if (o?.bucket === bucket && o?.storage_path === path) {
      found = true
      return { ...o, amount }
    }
    return o
  })
  if (!found) {
    next.push({ type: 'pv', bucket, storage_path: path, amount })
  }
  const patch: any = { offers: next }
  if (!lead.offer_amount || Number(lead.offer_amount) <= 0) {
    patch.offer_amount = amount
  }
  await supabase.from('leads').update(patch).eq('id', leadId)
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }
    const payload = await req.json().catch(() => ({}))
    const bucket = String(payload.bucket || '')
    const path = String(payload.path || '')
    const leadId = String(payload.leadId || payload.lead_id || '')
    if (!bucket || !path || !leadId) {
      return new Response(JSON.stringify({ error: 'missing bucket/path/leadId' }), { status: 400 })
    }
    const amt = await extractAmount(bucket, path)
    if (amt && amt > 0) {
      await updateLeadOfferAmount(leadId, bucket, path, amt)
    }
    return new Response(JSON.stringify({ success: true, amount: amt ?? null }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), { status: 500 })
  }
})




