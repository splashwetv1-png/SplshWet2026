import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectDir = path.resolve(__dirname, '..')
const envContent = await fs.readFile(path.join(projectDir, '.env'), 'utf8')

function getEnvValue(name) {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'))
  return match ? match[1].trim() : null
}

const supabaseUrl = getEnvValue('SUPABASE_URL')
const serviceRoleKey = getEnvValue('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase credentials not found in .env')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

function buildSequelItemDescription(albumDescription, itemIndex) {
  if (!albumDescription?.trim()) {
    return `Sequel item ${itemIndex + 1}`
  }

  return `${albumDescription.trim()} - Item ${itemIndex + 1}`
}

const { data: sequels, error: sequelsError } = await supabase
  .from('conteudos')
  .select('id, descricao, criado_em, metadados')
  .eq('tipo', 'sequel')

if (sequelsError) {
  throw sequelsError
}

const { data: hiddenChildren, error: hiddenChildrenError } = await supabase
  .from('conteudos')
  .select('id, metadados')
  .contains('metadados', { hiddenFromFeeds: true })

if (hiddenChildrenError) {
  throw hiddenChildrenError
}

const childKeySet = new Set(
  hiddenChildren
    .map((item) => {
      const parentSequelId = item.metadados?.parentSequelId
      const sequelItemIndex = item.metadados?.sequelItemIndex
      return typeof parentSequelId === 'string' && Number.isInteger(sequelItemIndex)
        ? `${parentSequelId}:${sequelItemIndex}`
        : null
    })
    .filter(Boolean),
)

const childPayload = []

for (const sequel of sequels) {
  const items = Array.isArray(sequel.metadados?.items) ? sequel.metadados.items : []

  items.forEach((item, itemIndex) => {
    if (!item || typeof item !== 'object') {
      return
    }

    const urlVideo = typeof item.urlVideo === 'string' ? item.urlVideo.trim() : ''
    if (!urlVideo) {
      return
    }

    const key = `${sequel.id}:${itemIndex}`
    if (childKeySet.has(key)) {
      return
    }

    const mediaType = item.mediaType === 'photo' ? 'photo' : 'video'

    childPayload.push({
      titulo: null,
      descricao: buildSequelItemDescription(sequel.descricao, itemIndex),
      url_video: urlVideo,
      url_capa: typeof item.urlCapa === 'string' && item.urlCapa.trim() ? item.urlCapa.trim() : null,
      tipo: mediaType === 'photo' ? 'photo_normal' : 'video_normal',
      metadados: {
        parentSequelId: sequel.id,
        sequelItemIndex: itemIndex,
        hiddenFromFeeds: true,
        source: 'sequel_item',
        mediaType,
        albumUrl: null,
        coordenadas: {
          width: typeof item.width === 'number' ? item.width : null,
          height: typeof item.height === 'number' ? item.height : null,
        },
      },
      visualizacoes: 0,
      likes: 0,
      criado_em: sequel.criado_em,
    })
  })
}

if (childPayload.length) {
  const { error: insertError } = await supabase.from('conteudos').insert(childPayload)
  if (insertError) {
    throw insertError
  }
}

const { data: legacyLikes, error: legacyLikesError } = await supabase
  .from('likes_utilizadores')
  .select('utilizador_id, conteudo_id, criado_em, conteudos!inner(id, tipo)')

if (legacyLikesError) {
  throw legacyLikesError
}

const sequelAlbumLikes = legacyLikes.filter((item) => item.conteudos?.tipo === 'sequel')

const { data: legacyPlaylistItems, error: legacyPlaylistItemsError } = await supabase
  .from('playlist_conteudos')
  .select('playlist_id, conteudo_id, conteudos!inner(id, tipo)')

if (legacyPlaylistItemsError) {
  throw legacyPlaylistItemsError
}

const sequelAlbumPlaylistItems = legacyPlaylistItems.filter((item) => item.conteudos?.tipo === 'sequel')

const backupPath = path.join(projectDir, 'supabase-sequel-legacy-backup-20260625.json')
await fs.writeFile(
  backupPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sequelAlbumLikes,
      sequelAlbumPlaylistItems,
    },
    null,
    2,
  ),
  'utf8',
)

if (sequelAlbumLikes.length) {
  const { error: deleteLikesError } = await supabase
    .from('likes_utilizadores')
    .delete()
    .in(
      'conteudo_id',
      Array.from(new Set(sequelAlbumLikes.map((item) => item.conteudo_id))),
    )

  if (deleteLikesError) {
    throw deleteLikesError
  }
}

if (sequelAlbumPlaylistItems.length) {
  const { error: deletePlaylistError } = await supabase
    .from('playlist_conteudos')
    .delete()
    .in(
      'conteudo_id',
      Array.from(new Set(sequelAlbumPlaylistItems.map((item) => item.conteudo_id))),
    )

  if (deletePlaylistError) {
    throw deletePlaylistError
  }
}

const affectedContentIds = Array.from(new Set(sequels.map((item) => item.id)))

if (affectedContentIds.length) {
  const { data: remainingLikes, error: remainingLikesError } = await supabase
    .from('likes_utilizadores')
    .select('conteudo_id')
    .in('conteudo_id', affectedContentIds)

  if (remainingLikesError) {
    throw remainingLikesError
  }

  const likeCountByContentId = new Map()
  for (const row of remainingLikes) {
    likeCountByContentId.set(row.conteudo_id, (likeCountByContentId.get(row.conteudo_id) || 0) + 1)
  }

  for (const contentId of affectedContentIds) {
    const { error: updateLikesError } = await supabase
      .from('conteudos')
      .update({ likes: likeCountByContentId.get(contentId) || 0 })
      .eq('id', contentId)

    if (updateLikesError) {
      throw updateLikesError
    }
  }
}

console.log(
  JSON.stringify(
    {
      insertedChildren: childPayload.length,
      removedLegacyAlbumLikes: sequelAlbumLikes.length,
      removedLegacyAlbumPlaylistItems: sequelAlbumPlaylistItems.length,
      backupPath,
    },
    null,
    2,
  ),
)
