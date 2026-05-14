import { createReadStream } from 'node:fs'
import { access } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')
const distDir = join(__dirname, 'dist')
const indexPath = join(distDir, 'index.html')
const port = Number(process.env.PORT || '4173')
const proxyTarget = (process.env.API_PROXY_TARGET || 'https://api.cacheon.ai').replace(/\/$/, '')

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function setNoCacheHeaders(response) {
  response.setHeader('Cache-Control', 'no-cache')
}

function sendFile(response, filePath) {
  const extension = extname(filePath)
  response.statusCode = 200
  response.setHeader('Content-Type', mimeTypes[extension] || 'application/octet-stream')
  setNoCacheHeaders(response)
  createReadStream(filePath).pipe(response)
}

function sendHead(response, filePath) {
  const extension = extname(filePath)
  response.statusCode = 200
  response.setHeader('Content-Type', mimeTypes[extension] || 'application/octet-stream')
  setNoCacheHeaders(response)
  response.end()
}

async function proxyApi(request, response, pathname, search) {
  try {
    const upstreamResponse = await fetch(`${proxyTarget}${pathname}${search}`, {
      method: 'GET',
      headers: {
        accept: request.headers.accept || '*/*',
      },
    })

    const body = Buffer.from(await upstreamResponse.arrayBuffer())
    response.statusCode = upstreamResponse.status

    const contentType = upstreamResponse.headers.get('content-type')
    if (contentType) {
      response.setHeader('Content-Type', contentType)
    }

    const cacheControl = upstreamResponse.headers.get('cache-control')
    if (cacheControl) {
      response.setHeader('Cache-Control', cacheControl)
    } else {
      setNoCacheHeaders(response)
    }

    if (request.method === 'HEAD') {
      response.end()
      return
    }

    response.end(body)
  } catch {
    response.statusCode = 502
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify({ error: 'Unable to reach upstream API' }))
  }
}

async function resolveStaticPath(pathname) {
  const cleanPath = pathname.replace(/^\/+/, '') || 'index.html'
  const candidatePath = resolve(distDir, cleanPath)

  if (!candidatePath.startsWith(distDir)) {
    return indexPath
  }

  try {
    await access(candidatePath)
    return candidatePath
  } catch {
    return indexPath
  }
}

const server = createServer(async (request, response) => {
  if (!request.url) {
    response.statusCode = 400
    response.end('Bad request')
    return
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405
    response.setHeader('Allow', 'GET, HEAD')
    response.end('Method not allowed')
    return
  }

  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)

  if (url.pathname.startsWith('/api/')) {
    await proxyApi(request, response, url.pathname, url.search)
    return
  }

  const filePath = await resolveStaticPath(url.pathname)

  if (request.method === 'HEAD') {
    sendHead(response, filePath)
    return
  }

  sendFile(response, filePath)
})

server.listen(port, '0.0.0.0', () => {
  console.log(`SN14 dashboard listening on http://0.0.0.0:${port}`)
})