import type { Category, ContentRecord } from '../../shared/types.js'
import { env } from '../config/env.js'
import { TtlCache } from '../lib/ttl-cache.js'
import { supabase } from '../lib/supabase.js'

type ContentMetadata = Record<string, unknown>
type ContentTypeFilter = 'video' | 'all'
type PaginatedParams = {
  offset: number
  limit: number
  categoryId?: string | null
}

export type PlaylistWithItems = {
  id: string
  nome: string
  criado_em: string
  itemCount: number
  items: ContentRecord[]
}

const cache = new TtlCache()
const DEFAULT_CONTENT_LIMIT = 12
const DEFAULT_VIDEO_FEED_LIMIT = 5
const MAX_CONTENT_LIMIT = 24
const MAX_VIDEO_FEED_LIMIT = 10
const DEFAULT_SAVED_LIMIT = 100


function clampOffset(offset: number) {
  return Math.max(0, offset)
}

function clampLimit(limit: number, maximum = MAX_CONTENT_LIMIT) {
  return Math.min(Math.max(limit, 1), maximum)
}

async function readCached<T>(key: string, resolver: () => Promise<T>, ttlMs = env.cacheTtlMs) {
  const cached = cache.get<T>(key)

  if (cached !== null) {
    return cached
  }

  const value = await resolver()
  cache.set(key, value, ttlMs)
  return value
}

async function readCategory(categoryId: string) {
  const { data, error } = await supabase.from('categorias').select('*').eq('id', categoryId).maybeSingle()

  if (error || !data) {
    throw new Error(error?.message || 'category not found')
  }

  return data as Category
}


async function listContentIdsForCategory(categoryId: string) {
  const { data, error } = await supabase.from('conteudo_categorias').select('conteudo_id').eq('categoria_id', categoryId)

  if (error) {
    throw new Error(error.message)
  }

  return data.map((item) => item.conteudo_id)
}

async function listContentsByIds(ids: string[]) {
  if (!ids.length) {
    return []
  }

  const { data, error } = await supabase.from('conteudos').select('*').in('id', ids)

  if (error) {
    throw new Error(error.message)
  }

  const itemsById = new Map(data.map((item) => [item.id, item]))
  return ids.map((id) => itemsById.get(id)).filter(Boolean) as ContentRecord[]
}

async function syncLikeCount(contentId: string) {
  const [{ count, error: countError }, { data: content, error: contentError }] = await Promise.all([
    supabase.from('likes_utilizadores').select('conteudo_id', { count: 'exact', head: true }).eq('conteudo_id', contentId),
    supabase.from('conteudos').select('id').eq('id', contentId).maybeSingle(),
  ])

  if (countError) {
    throw new Error(countError.message)
  }

  if (contentError || !content) {
    throw new Error(contentError?.message || 'content not found')
  }

  const likes = count ?? 0
  const { error: updateError } = await supabase.from('conteudos').update({ likes }).eq('id', contentId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  return likes
}

async function listVisibleContentPage(params: PaginatedParams & { type: ContentTypeFilter }) {
  const safeOffset = clampOffset(params.offset)
  const safeLimit = clampLimit(params.limit, params.type === 'video' ? MAX_VIDEO_FEED_LIMIT : MAX_CONTENT_LIMIT)

  let matchingIds: string[] | null = null

  if (params.categoryId) {
    matchingIds = await listContentIdsForCategory(params.categoryId)

    if (!matchingIds.length) {
      return {
        items: [] as ContentRecord[],
        total: 0,
        hasMore: false,
        offset: safeOffset,
        limit: safeLimit,
      }
    }
  }

  let query = supabase.from('conteudos').select('*', { count: 'exact' }).not('metadados', 'cs', '{"hiddenFromFeeds":true}')

  if (params.type === 'video') {
    query = query.in('tipo', ['video_normal', 'photo_normal'])
  }

  if (matchingIds) {
    query = query.in('id', matchingIds)
  }

  query = query.order('criado_em', { ascending: false })

  const { data, error, count } = await query.range(safeOffset, safeOffset + safeLimit - 1)

  if (error) {
    throw new Error(error.message)
  }

  const items = ((data || []) as ContentRecord[]).filter(Boolean)

  return {
    items,
    total: count ?? 0,
    hasMore: safeOffset + safeLimit < (count ?? 0),
    offset: safeOffset,
    limit: safeLimit,
  }
}

export async function listPublicContent(params: { offset: number; limit: number }) {
  return listVisibleContentPage({
    offset: params.offset,
    limit: params.limit,
    type: 'all',
  })
}

export async function listPublicCategories() {
  return readCached(
    'public:categories',
    async () => {
      const { data, error } = await supabase.from('categorias').select('*').order('nome', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return data as Category[]
    },
    env.cacheTtlMs,
  )
}

export async function listVideoFeedPage(params: PaginatedParams) {
  return listVisibleContentPage({
    offset: params.offset,
    limit: params.limit || DEFAULT_VIDEO_FEED_LIMIT,
    categoryId: params.categoryId,
    type: 'video',
  })
}


export async function listRandomVideoFeed() {
  const { data, error } = await supabase
    .from('conteudos')
    .select('*')
    .not('metadados', 'cs', '{"hiddenFromFeeds":true}')
    .in('tipo', ['video_normal', 'photo_normal'])

  if (error) throw new Error(error.message)

  const arr = (data as ContentRecord[]).slice()

  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  return arr
}

export async function getCategoryContent(categoryId: string, params?: { offset?: number; limit?: number }) {
  const safeOffset = clampOffset(params?.offset ?? 0)
  const safeLimit = clampLimit(params?.limit ?? MAX_CONTENT_LIMIT)

  const categoria = await readCategory(categoryId)
  const page = await listVisibleContentPage({
    categoryId,
    offset: safeOffset,
    limit: safeLimit,
    type: 'all',
  })

  return {
    categoria,
    videos: page.items.filter((item) => item.tipo === 'video_normal' || item.tipo === 'photo_normal'),
  }
}

export async function getCategoryVideoPage(params: { categoryId: string; offset: number; limit: number }) {
  const categoria = await readCategory(params.categoryId)
  const page = await listVideoFeedPage(params)

  return {
    categoria,
    ...page,
  }
}


export async function toggleContentLike(userId: string, contentId: string) {
  const { data: existingLike, error: existingLikeError } = await supabase
    .from('likes_utilizadores')
    .select('conteudo_id')
    .match({
      utilizador_id: userId,
      conteudo_id: contentId,
    })
    .maybeSingle()

  if (existingLikeError) {
    throw new Error(existingLikeError.message)
  }

  if (existingLike) {
    const { error } = await supabase
      .from('likes_utilizadores')
      .delete()
      .match({ utilizador_id: userId, conteudo_id: contentId })

    if (error) {
      throw new Error(error.message)
    }

    const likes = await syncLikeCount(contentId)

    return {
      liked: false,
      likes,
    }
  }

  const { error } = await supabase.from('likes_utilizadores').insert({
    utilizador_id: userId,
    conteudo_id: contentId,
  })

  if (error) {
    throw new Error(error.message)
  }

  const likes = await syncLikeCount(contentId)

  return {
    liked: true,
    likes,
  }
}

export async function listUserLikedVideos(userId: string, params?: { offset?: number; limit?: number }) {
  const safeOffset = clampOffset(params?.offset ?? 0)
  const safeLimit = clampLimit(params?.limit ?? DEFAULT_SAVED_LIMIT, DEFAULT_SAVED_LIMIT)

  const { data, error } = await supabase
    .from('likes_utilizadores')
    .select('conteudo_id')
    .eq('utilizador_id', userId)
    .order('criado_em', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1)

  if (error) {
    throw new Error(error.message)
  }

  return listContentsByIds(data.map((item) => item.conteudo_id))
}

export async function listUserPlaylists(userId: string, params?: { offset?: number; limit?: number }) {
  const safeOffset = clampOffset(params?.offset ?? 0)
  const safeLimit = clampLimit(params?.limit ?? DEFAULT_SAVED_LIMIT, DEFAULT_SAVED_LIMIT)

  const { data: playlists, error: playlistsError } = await supabase
    .from('playlists')
    .select('*')
    .eq('utilizador_id', userId)
    .order('criado_em', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1)

  if (playlistsError) {
    throw new Error(playlistsError.message)
  }

  if (!playlists.length) {
    return [] as PlaylistWithItems[]
  }

  const playlistIds = playlists.map((playlist) => playlist.id)

  const { data: playlistLinks, error: linksError } = await supabase
    .from('playlist_conteudos')
    .select('playlist_id, conteudo_id')
    .in('playlist_id', playlistIds)

  if (linksError) {
    throw new Error(linksError.message)
  }

  const contentIds = Array.from(new Set(playlistLinks.map((item) => item.conteudo_id)))
  const contents = await listContentsByIds(contentIds)
  const contentsById = new Map(contents.map((item) => [item.id, item]))

  return playlists.map((playlist) => {
    const items = playlistLinks
      .filter((item) => item.playlist_id === playlist.id)
      .map((item) => contentsById.get(item.conteudo_id))
      .filter(Boolean) as ContentRecord[]

    return {
      id: playlist.id,
      nome: playlist.nome,
      criado_em: playlist.criado_em,
      itemCount: items.length,
      items,
    }
  })
}

export async function getUserSavedContent(userId: string) {
  const [likedVideos, playlists] = await Promise.all([listUserLikedVideos(userId), listUserPlaylists(userId)])

  return {
    likedVideos,
    playlists,
  }
}

export async function createUserPlaylist(userId: string, name: string) {
  const normalizedName = name.trim()

  if (!normalizedName) {
    throw new Error('playlist name is required')
  }

  const { data, error } = await supabase
    .from('playlists')
    .insert({
      utilizador_id: userId,
      nome: normalizedName,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'failed to create playlist')
  }

  cache.delete('public:categories')

  return {
    id: data.id,
    nome: data.nome,
    criado_em: data.criado_em,
    itemCount: 0,
    items: [] as ContentRecord[],
  }
}

export async function addContentToPlaylists(userId: string, contentId: string, playlistIds: string[]) {
  const sanitizedPlaylistIds = Array.from(new Set(playlistIds.filter((value) => typeof value === 'string' && value.trim())))

  if (!sanitizedPlaylistIds.length) {
    throw new Error('select at least one playlist')
  }

  const { data: ownedPlaylists, error: playlistsError } = await supabase
    .from('playlists')
    .select('id')
    .eq('utilizador_id', userId)
    .in('id', sanitizedPlaylistIds)

  if (playlistsError) {
    throw new Error(playlistsError.message)
  }

  if (!ownedPlaylists.length) {
    throw new Error('no valid playlists were selected')
  }

  const { error } = await supabase.from('playlist_conteudos').upsert(
    ownedPlaylists.map((playlist) => ({
      playlist_id: playlist.id,
      conteudo_id: contentId,
    })),
    {
      onConflict: 'playlist_id,conteudo_id',
      ignoreDuplicates: true,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  return listUserPlaylists(userId)
}
