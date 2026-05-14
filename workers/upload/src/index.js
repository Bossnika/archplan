// Cloudflare Worker — File upload to R2
// Accepts: POST multipart/form-data with fields: file, uid, projectId, phaseId
// Returns: { url, name, size }

const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

async function verifyFirebaseToken(token, projectId) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Format JWT invalid')

  const decode = b64 =>
    JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(b64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    ))

  const header  = decode(parts[0])
  const payload = decode(parts[1])

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp < now)       throw new Error('Token expirat')
  if (payload.iat > now + 300) throw new Error('Token emis în viitor')
  if (payload.iss !== `https://securetoken.google.com/${projectId}`)
                               throw new Error('Issuer invalid')
  if (payload.aud !== projectId) throw new Error('Audience invalid')

  const keysRes = await fetch(GOOGLE_CERTS_URL)
  const { keys } = await keysRes.json()
  const jwk = keys.find(k => k.kid === header.kid)
  if (!jwk) throw new Error('Cheie publică negăsită')

  const publicKey = await crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['verify']
  )
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  const sig  = Uint8Array.from(
    atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  )
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, sig, data)
  if (!valid) throw new Error('Semnătură invalidă')
  return payload
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })
    if (request.method !== 'POST')
      return new Response('Method not allowed', { status: 405, headers: CORS })

    try {
      // Verify auth
      const auth = request.headers.get('Authorization') || ''
      const token = auth.replace('Bearer ', '')
      if (!token) return new Response('Unauthorized', { status: 401, headers: CORS })
      const payload = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID)

      // Parse multipart form
      const form = await request.formData()
      const file = form.get('file')
      const uid = form.get('uid')
      const projectId = form.get('projectId')
      const context = form.get('context') || 'general'

      if (!file || !uid || !projectId)
        return new Response('Missing fields', { status: 400, headers: CORS })
      if (payload.sub !== uid)
        return new Response('UID mismatch', { status: 403, headers: CORS })

      // Build R2 key: users/{uid}/projects/{projectId}/{context}/{timestamp}_{filename}
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const key = `users/${uid}/projects/${projectId}/${context}/${Date.now()}_${safeName}`

      // Upload to R2
      await env.BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' },
      })

      const url = `${env.PUBLIC_BUCKET_URL}/${key}`
      return new Response(JSON.stringify({ url, name: file.name, size: file.size, key }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
  }
}
