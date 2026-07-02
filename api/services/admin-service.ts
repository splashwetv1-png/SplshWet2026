import type { AlbumMediaItem, SaveVideoNormalInput } from '../../shared/types.js'
import { env } from '../config/env.js'
import { supabase } from '../lib/supabase.js'
import { keepVideoItems, normalizeAlbumPayload } from '../utils/erome.js'

type ContentMetadata = Record<string, unknown>

async function attachCategories(conteudoId: string, categoriasIds: string[]) {
  if (!categoriasIds.length) {
    return
  }

  const { error } = await supabase.from('conteudo_categorias').insert(
    categoriasIds.map((categoriaId) => ({
      conteudo_id: conteudoId,
      categoria_id: categoriaId,
    })),
  )

  if (error) {
    throw new Error(error.message)
  }
}

async function rollbackContent(conteudoId: string) {
  await supabase.from('conteudos').delete().eq('id', conteudoId)
}

function isHiddenFromFeeds(item: { metadados: ContentMetadata | null | undefined }) {
  return item.metadados?.hiddenFromFeeds === true
}



export async function listCategories() {
  const { data, error } = await supabase.from('categorias').select('*').order('nome', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function createCategory(nome: string) {
  const trimmedName = nome.trim()

  if (!trimmedName) {
    throw new Error('category name is required')
  }

  const { data, error } = await supabase
    .from('categorias')
    .insert({ nome: trimmedName })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'failed to create category')
  }

  return data
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categorias').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function listAdminContent() {
  const { data, error } = await supabase.from('conteudos').select('*').order('criado_em', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data.filter((item) => !isHiddenFromFeeds(item as { metadados: ContentMetadata }))
}

export async function deleteContents(ids: string[]) {
  const sanitizedIds = ids.filter((id) => typeof id === 'string' && id.trim())

  if (!sanitizedIds.length) {
    throw new Error('select at least one content item')
  }

  const { error } = await supabase.from('conteudos').delete().in('id', sanitizedIds)

  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchAlbumFromProvider(albumUrl: string) {
  const sanitizedUrl = albumUrl.trim()

  if (!sanitizedUrl.startsWith('http')) {
    throw new Error('please provide a valid album url')
  }

  const endpoint = `https://eromedownloader.net/api/download/posts?key=${env.eromeApiKey}&urls=${encodeURIComponent(
    sanitizedUrl,
  )}`

  const response = await fetch(endpoint)
  const raw = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(`failed to fetch EroMe downloader response: ${response.status}`)
  }

  const items = keepVideoItems(normalizeAlbumPayload(raw))

  if (!items.length) {
    throw new Error('no video items were found in the external api response')
  }

  return {
    albumUrl: sanitizedUrl,
    items,
    raw,
  }
}

function firstCover(items: AlbumMediaItem[]) {
  return items.find((item) => item.coverUrl)?.coverUrl || null
}

export async function saveVideoNormal(input: SaveVideoNormalInput) {
  if (!input.urlVideo?.trim()) {
    throw new Error('the final media url is required')
  }

  if (!input.categoriasIds?.length) {
    throw new Error('select at least one category before saving content')
  }

  const contentType = input.mediaType === 'photo' ? 'photo_normal' : 'video_normal'

  const { data, error } = await supabase
    .from('conteudos')
    .insert({
      titulo: null,
      descricao: input.descricao?.trim() || null,
      url_video: input.urlVideo.trim(),
      url_capa: input.urlCapa?.trim() || null,
      tipo: contentType,
      metadados: {
        mediaType: input.mediaType,
        coordenadas: {
          width: input.coordenadas?.width ?? null,
          height: input.coordenadas?.height ?? null,
        },
      },
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'failed to save content')
  }

  try {
    await attachCategories(data.id, input.categoriasIds)
  } catch (error) {
    await rollbackContent(data.id)
    throw error
  }

  return data
}



export async function listPublicContent() {
  const { data, error } = await supabase.from('conteudos').select('*').order('criado_em', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return {
    videos: data.filter((item) => item.tipo === 'video_normal' || item.tipo === 'photo_normal'),
  }
}

export function getAlbumPreviewDefaults(items: AlbumMediaItem[]) {
  return {
    itemCount: items.length,
    coverUrl: firstCover(items),
  }
}
