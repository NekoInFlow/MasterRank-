/**
 * Прослойка MasterRank: HTTP-запросы к Supabase идут через этот Worker,
 * чтобы обойти блокировки прямого доступа к *.supabase.co из браузера.
 *
 * Поддерживаются пути /rest/v1, /auth/v1, /storage/v1 (если понадобится).
 * Realtime (WebSocket) здесь не проксируется — в приложении включён опрос по HTTP.
 */

export interface Env {
  /** Полный origin проекта, например https://abcdefgh.supabase.co */
  SUPABASE_ORIGIN: string
  /** Необязательно: жёстко разрешённый Origin фронта. Если не задан — подставляем Origin из запроса или * */
  ALLOWED_ORIGIN?: string
}

function allowOrigin(req: Request, env: Env): string {
  if (env.ALLOWED_ORIGIN === '*') {
    return '*'
  }
  const fromHeader = req.headers.get('Origin')
  if (env.ALLOWED_ORIGIN && fromHeader === env.ALLOWED_ORIGIN) {
    return fromHeader
  }
  if (!env.ALLOWED_ORIGIN || env.ALLOWED_ORIGIN.trim() === '') {
    return fromHeader || '*'
  }
  return env.ALLOWED_ORIGIN
}

function corsHeaders(req: Request, env: Env, extra?: Record<string, string>): Headers {
  const h = new Headers()
  const ao = allowOrigin(req, env)
  h.set('Access-Control-Allow-Origin', ao)
  if (ao !== '*') {
    h.set('Access-Control-Allow-Credentials', 'true')
  }
  h.set('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS')
  const reqHdrs = req.headers.get('Access-Control-Request-Headers')
  h.set(
    'Access-Control-Allow-Headers',
    reqHdrs ||
      [
        'authorization',
        'apikey',
        'content-type',
        'x-client-info',
        'accept',
        'prefer',
        'accept-profile',
        'content-profile',
        'range',
        'x-upsert',
      ].join(','),
  )
  h.set('Access-Control-Max-Age', '86400')
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      h.set(k, v)
    }
  }
  return h
}

/** Нормализует origin без хвостового слэша */
function normalizeOrigin(raw: string): string {
  return raw.replace(/\/+$/, '')
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) })
    }

    const origin = normalizeOrigin(env.SUPABASE_ORIGIN || '')
    if (!origin.startsWith('https://') || !origin.includes('.supabase.co')) {
      return new Response(
        '[masterrank-proxy] Задайте секрет SUPABASE_ORIGIN вида https://xxx.supabase.co (wrangler secret put)',
        {
          status: 500,
          headers: corsHeaders(request, env, { 'content-type': 'text/plain;charset=utf-8' }),
        },
      )
    }

    const incoming = new URL(request.url)

    /** Не даём использовать Worker как универсальный анонимайзер (только нужные префиксы). */
    const path = incoming.pathname || '/'
    const allowed =
      path.startsWith('/rest/v1') || path.startsWith('/auth/v1') || path.startsWith('/storage/v1')

    if (!allowed) {
      return new Response('Forbidden proxy path', {
        status: 403,
        headers: corsHeaders(request, env, { 'content-type': 'text/plain;charset=utf-8' }),
      })
    }

    const upstream = `${origin}${path}${incoming.search}`

    const outHeaders = new Headers(request.headers)
    outHeaders.delete('host')
    outHeaders.delete('cf-connecting-ip')
    /** Cloudflare добавляет свой Host — задаём целевой */
    try {
      outHeaders.set('Host', new URL(origin).hostname)
    } catch {
      /* skip */
    }

    const init: RequestInit = {
      method: request.method,
      headers: outHeaders,
      redirect: 'follow',
    }
    if (!['GET', 'HEAD'].includes(request.method) && request.body) {
      init.body = request.body
      ;(init as RequestInit & { duplex?: 'half' }).duplex = 'half'
    }

    const upstreamResp = await fetch(upstream, init)

    const responseHeaders = new Headers(upstreamResp.headers)
    const ch = corsHeaders(request, env)
    ch.forEach((v, k) => {
      responseHeaders.set(k, v)
    })

    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      statusText: upstreamResp.statusText,
      headers: responseHeaders,
    })
  },
}
