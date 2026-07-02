import type { AlbumMediaItem, AlbumMediaType } from '../../shared/types.js'

function isHttpUrl(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('http')
}

function isImageFileUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i.test(url)
}

function isVideoFileUrl(url: string) {
  return /\.(mp4|mov|webm|m3u8)(\?|$)/i.test(url)
}

function guessMediaType(url: string): AlbumMediaType {
  const normalized = url.toLowerCase()

  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(normalized)) {
    return 'photo'
  }

  return 'video'
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function findSourceUrl(item: Record<string, unknown>) {
  const candidates = [
    item.download_url,
    item.direct_url,
    item.media_url,
    item.file,
    item.video,
    item.image,
    item.src,
    item.url,
  ]

  const urls = candidates.filter(isHttpUrl)

  return urls.find((url) => isImageFileUrl(url) || isVideoFileUrl(url)) || urls[0] || null
}

function findCoverUrl(item: Record<string, unknown>) {
  const candidates = [item.thumb, item.thumbnail, item.poster, item.preview, item.cover, item.cover_url]
  return candidates.find((value): value is string => isHttpUrl(value) && !isVideoFileUrl(value)) || null
}

function isLikelyLeafMediaRecord(item: Record<string, unknown>) {
  if (!findSourceUrl(item)) {
    return false
  }

  const explicitMediaKeys = [
    'src',
    'download_url',
    'file',
    'video',
    'image',
    'media_url',
    'direct_url',
    'thumb',
    'thumbnail',
    'poster',
    'preview',
    'cover',
    'cover_url',
    'width',
    'height',
    'type',
  ]

  if (explicitMediaKeys.some((key) => key in item)) {
    return true
  }

  return typeof item.url === 'string' && (isImageFileUrl(item.url) || isVideoFileUrl(item.url))
}

function normalizeItem(item: Record<string, unknown>): AlbumMediaItem | null {
  const sourceUrl = findSourceUrl(item)

  if (!sourceUrl) {
    return null
  }

  return {
    sourceUrl,
    coverUrl: findCoverUrl(item),
    mediaType: (typeof item.type === 'string' && item.type.toLowerCase().includes('photo')
      ? 'photo'
      : typeof item.type === 'string' && item.type.toLowerCase().includes('image')
        ? 'photo'
        : guessMediaType(sourceUrl)),
    width: asNumber(item.width),
    height: asNumber(item.height),
    providerId: typeof item.id === 'string' ? item.id : null,
  }
}

function extractRawItems(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    const records = payload.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    const nestedItems = records.flatMap((item) => extractRawItems(item))

    if (nestedItems.length) {
      return nestedItems
    }

    return records.filter((item) => isLikelyLeafMediaRecord(item))
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as Record<string, unknown>
  const directCandidates = [
    record.items,
    record.content,
    record.media,
    record.files,
    record.data,
    record.result,
    record.response,
    record.post,
    record.posts,
  ]

  const nestedItems = directCandidates.flatMap((candidate) => extractRawItems(candidate))

  if (nestedItems.length) {
    return nestedItems
  }

  return isLikelyLeafMediaRecord(record) ? [record] : []
}

export function normalizeAlbumPayload(payload: unknown) {
  const items = extractRawItems(payload)
    .map((item) => normalizeItem(item))
    .filter((item): item is AlbumMediaItem => item !== null)

  return items
}

export function keepVideoItems(items: AlbumMediaItem[]) {
  return items.filter((item) => item.mediaType === 'video')
}
