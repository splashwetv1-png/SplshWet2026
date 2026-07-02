export type ContentType = 'video_normal' | 'photo_normal'

export type AlbumMediaType = 'video' | 'photo'

export type AuthRole = 'admin' | 'user'

export type AuthUser = {
  id: string
  username: string
  role: AuthRole
}

export type SessionPayload = AuthUser & {
  token: string
}

export type Category = {
  id: string
  nome: string
  criado_em: string
}

export type AlbumMediaItem = {
  sourceUrl: string
  coverUrl: string | null
  mediaType: AlbumMediaType
  width: number | null
  height: number | null
  providerId: string | null
}

export type ContentRecord = {
  id: string
  titulo: string | null
  descricao: string | null
  url_video: string
  url_capa: string | null
  tipo: ContentType
  visualizacoes: number
  likes: number
  criado_em: string
  metadados: Record<string, unknown>
}

export type SaveVideoNormalInput = {
  descricao?: string | null
  urlVideo: string
  urlCapa?: string | null
  mediaType: AlbumMediaType
  categoriasIds: string[]
  coordenadas?: {
    width?: number | null
    height?: number | null
  } | null
}

