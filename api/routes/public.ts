import { Readable } from 'node:stream'
import { Router, type Request, type Response } from 'express'
import { verifySession } from '../utils/jwt.js'
import {
  addContentToPlaylists,
  createUserPlaylist,
  getCategoryContent,
  getUserSavedContent,
  listPublicCategories,
  listPublicContent,
  listVideoFeedPage,
  listRandomVideoFeed,
  listUserPlaylists,
  toggleContentLike,
} from '../services/public-service.js'

const router = Router()

function requireUserSession(req: Request, res: Response) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'missing token',
    })
    return null
  }

  try {
    const session = verifySession(token)

    if (session.role !== 'user') {
      res.status(403).json({
        success: false,
        error: 'user session required',
      })
      return null
    }

    return session
  } catch {
    res.status(401).json({
      success: false,
      error: 'invalid token',
    })
    return null
  }
}

function isAllowedMediaHost(hostname: string) {
  return hostname === 'erome.com' || hostname.endsWith('.erome.com')
}

router.get('/conteudos', async (req, res) => {
  try {
    const offset = Number.parseInt(String(req.query.offset || '0'), 10)
    const limit = Number.parseInt(String(req.query.limit || '12'), 10)
    const payload = await listPublicContent({
      offset: Number.isFinite(offset) ? offset : 0,
      limit: Number.isFinite(limit) ? limit : 12,
    })
    res.json({
      success: true,
      ...payload,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to load content',
    })
  }
})

router.get('/videos/random', async (_req, res) => {
  try {
    const videos = await listRandomVideoFeed()
    res.json({
      success: true,
      videos,
      hasMore: false,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to load video feed',
    })
  }
})

router.get('/videos', async (req, res) => {
  try {
    const offset = Number.parseInt(String(req.query.offset || '0'), 10)
    const limit = Number.parseInt(String(req.query.limit || '10'), 10)
    const payload = await listVideoFeedPage({
      offset: Number.isFinite(offset) ? offset : 0,
      limit: Number.isFinite(limit) ? limit : 10,
    })
    res.json({
      success: true,
      videos: payload.items,
      hasMore: payload.hasMore,
      total: payload.total,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to load video feed',
    })
  }
})



router.get('/categorias', async (_req, res) => {
  try {
    const categorias = await listPublicCategories()
    res.json({
      success: true,
      categorias,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to load categories',
    })
  }
})

router.get('/categorias/:id/conteudos', async (req, res) => {
  try {
    const offset = Number.parseInt(String(req.query.offset || '0'), 10)
    const limit = Number.parseInt(String(req.query.limit || '12'), 10)
    const payload = await getCategoryContent(req.params.id, {
      offset: Number.isFinite(offset) ? offset : 0,
      limit: Number.isFinite(limit) ? limit : 12,
    })
    res.json({
      success: true,
      ...payload,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to load category content',
    })
  }
})

router.get('/me/saved', async (req, res) => {
  const session = requireUserSession(req, res)

  if (!session) {
    return
  }

  try {
    const payload = await getUserSavedContent(session.id)
    res.json({
      success: true,
      ...payload,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to load saved content',
    })
  }
})

router.get('/me/playlists', async (req, res) => {
  const session = requireUserSession(req, res)

  if (!session) {
    return
  }

  try {
    const playlists = await listUserPlaylists(session.id)
    res.json({
      success: true,
      playlists,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to load playlists',
    })
  }
})

router.post('/me/playlists', async (req, res) => {
  const session = requireUserSession(req, res)

  if (!session) {
    return
  }

  try {
    const playlist = await createUserPlaylist(session.id, typeof req.body?.name === 'string' ? req.body.name : '')
    res.status(201).json({
      success: true,
      playlist,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to create playlist',
    })
  }
})

router.post('/me/playlists/add', async (req, res) => {
  const session = requireUserSession(req, res)

  if (!session) {
    return
  }

  try {
    const contentId = typeof req.body?.contentId === 'string' ? req.body.contentId : ''
    const playlistIds = Array.isArray(req.body?.playlistIds) ? req.body.playlistIds : []
    const playlists = await addContentToPlaylists(session.id, contentId, playlistIds)

    res.json({
      success: true,
      playlists,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to update playlists',
    })
  }
})

router.post('/conteudos/:id/like', async (req, res) => {
  const session = requireUserSession(req, res)

  if (!session) {
    return
  }

  try {
    const payload = await toggleContentLike(session.id, req.params.id)
    res.json({
      success: true,
      ...payload,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to update like',
    })
  }
})

router.get('/media-proxy', async (req, res) => {
  try {
    const target = typeof req.query.url === 'string' ? req.query.url : ''

    if (!target) {
      res.status(400).json({
        success: false,
        error: 'media url is required',
      })
      return
    }

    const parsedUrl = new URL(target)

    if (!isAllowedMediaHost(parsedUrl.hostname)) {
      res.status(400).json({
        success: false,
        error: 'unsupported media host',
      })
      return
    }

    const upstream = await fetch(parsedUrl, {
      headers: {
        'User-Agent':
          req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'https://www.erome.com/',
        Origin: 'https://www.erome.com',
        ...(typeof req.headers.range === 'string' ? { Range: req.headers.range } : {}),
      },
    })

    if (!upstream.ok && upstream.status !== 206) {
      res.status(upstream.status).json({
        success: false,
        error: `upstream media request failed with status ${upstream.status}`,
      })
      return
    }

    const passthroughHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'etag',
      'last-modified',
    ] as const

    passthroughHeaders.forEach((header) => {
      const value = upstream.headers.get(header)
      if (value) {
        res.setHeader(header, value)
      }
    })

    res.setHeader('access-control-expose-headers', 'content-length, content-range, accept-ranges, content-type')
    res.status(upstream.status)

    if (!upstream.body) {
      res.end()
      return
    }

    Readable.fromWeb(upstream.body as any).pipe(res)
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to proxy media',
    })
  }
})

export default router
