const ALLOWED_PREFIXES = ['/rest/v1', '/auth/v1', '/storage/v1']

function normalizeOrigin(value) {
  return String(value || '').replace(/\/+$/, '')
}

function isAllowedPath(pathname) {
  return ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export default async function handler(req, res) {
  const origin = normalizeOrigin(process.env.SUPABASE_ORIGIN)
  if (!origin.startsWith('https://') || !origin.includes('.supabase.co')) {
    res.status(500).send('SUPABASE_ORIGIN is not configured. Expected https://<ref>.supabase.co')
    return
  }

  const pathParts = Array.isArray(req.query.path) ? req.query.path : []
  const proxiedPath = `/${pathParts.join('/')}`
  if (!isAllowedPath(proxiedPath)) {
    res.status(403).send('Forbidden proxy path')
    return
  }

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue
    if (Array.isArray(value)) {
      for (const v of value) query.append(key, String(v))
    } else if (value != null) {
      query.append(key, String(value))
    }
  }

  const upstreamUrl = `${origin}${proxiedPath}${query.toString() ? `?${query}` : ''}`

  const headers = { ...req.headers }
  delete headers.host
  delete headers.connection
  delete headers['content-length']
  try {
    headers.host = new URL(origin).host
  } catch {
    // no-op
  }

  const upstream = await fetch(upstreamUrl, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
    redirect: 'follow',
  })

  res.status(upstream.status)
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'content-encoding') return
    res.setHeader(key, value)
  })

  const body = Buffer.from(await upstream.arrayBuffer())
  res.send(body)
}
