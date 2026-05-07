const ALLOWED_PREFIXES = ['/rest/v1', '/auth/v1', '/storage/v1']

function normalizeOrigin(value) {
  return String(value || '').replace(/\/+$/, '')
}

function isAllowedPath(pathname) {
  return ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function getProxiedPath(req) {
  const raw = req.query.path
  if (Array.isArray(raw)) {
    return `/${raw.join('/')}`
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return raw.startsWith('/') ? raw : `/${raw}`
  }
  return '/'
}

function buildUpstreamQuery(queryObj) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(queryObj)) {
    if (key === 'path') continue
    if (Array.isArray(value)) {
      for (const v of value) query.append(key, String(v))
    } else if (value != null) {
      query.append(key, String(value))
    }
  }
  return query
}

function corsHeaders(req) {
  const reqOrigin = String(req.headers.origin || '*')
  return {
    'Access-Control-Allow-Origin': reqOrigin,
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers':
      req.headers['access-control-request-headers'] ||
      'authorization,apikey,content-type,x-client-info,accept,prefer,accept-profile,content-profile,range,x-upsert',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin, Access-Control-Request-Headers',
  }
}

function getProxyApiKey() {
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  return typeof key === 'string' ? key.trim() : ''
}

export default async function handler(req, res) {
  const cors = corsHeaders(req)
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const origin = normalizeOrigin(process.env.SUPABASE_ORIGIN)
  if (!origin.startsWith('https://') || !origin.includes('.supabase.co')) {
    res.status(500).send('SUPABASE_ORIGIN is not configured. Expected https://<ref>.supabase.co')
    return
  }
  const proxyApiKey = getProxyApiKey()
  if (!proxyApiKey) {
    res
      .status(500)
      .send('SUPABASE_ANON_KEY is not configured. Add SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY) in Vercel env.')
    return
  }

  const proxiedPath = getProxiedPath(req)
  if (!isAllowedPath(proxiedPath)) {
    res.status(403).send('Forbidden proxy path')
    return
  }

  const query = buildUpstreamQuery(req.query)
  const upstreamUrl = `${origin}${proxiedPath}${query.toString() ? `?${query}` : ''}`

  const headers = { ...req.headers }
  delete headers.host
  delete headers.connection
  delete headers['content-length']
  if (!headers.apikey) {
    headers.apikey = proxyApiKey
  }
  if (!headers.authorization) {
    headers.authorization = `Bearer ${proxyApiKey}`
  }
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
