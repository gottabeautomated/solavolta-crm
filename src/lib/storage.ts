import { supabase } from './supabase'

function sanitizeFilename(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function uploadOfferPdf(params: {
  leadId: string
  offerType: 'pv' | 'storage' | 'emergency' | 'tvp'
  file: File
}): Promise<{ publicUrl: string; path: string; bucket: 'offers' | 'tvp' } | null> {
  const { leadId, offerType, file } = params
  // Mapping: TVP in eigenem Bucket, rest in 'offers'
  const bucket: 'offers' | 'tvp' = offerType === 'tvp' ? 'tvp' : 'offers'
  // Nutzer ermitteln (RLS-Policy: nur eigener User-Folder)
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id
  if (!userId) {
    console.error('Upload failed: no authenticated user')
    return null
  }
  const timestamp = Date.now()
  const safeName = sanitizeFilename(file.name)
  const path = `user/${userId}/leads/${leadId}/${offerType}/${timestamp}_${safeName}`

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type || 'application/pdf',
  })
  if (uploadError) {
    console.error('Upload failed:', uploadError)
    return null
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { publicUrl: data.publicUrl, path, bucket }
}

export async function getFileUrl(params: {
  bucket: 'offers' | 'tvp'
  path: string
  expiresInSeconds?: number
}): Promise<string | null> {
  const { bucket, path, expiresInSeconds = 3600 } = params
  try {
    // Versuche signierte URL (für private Buckets), fallback auf Public URL
    const { data: signed, error: signErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds)
    if (!signErr && signed?.signedUrl) return signed.signedUrl
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  } catch (e) {
    console.error('getFileUrl failed', e)
    return null
  }
}


