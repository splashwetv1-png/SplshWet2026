import type { AlbumMediaItem, AuthUser, Category, ContentRecord } from '../shared/types'

export type ApiEnvelope<T> = {
  success: boolean
  error?: string
} & T

export type AuthResponse = ApiEnvelope<{
  token: string
  user: AuthUser
}>

export type PublicContentResponse = ApiEnvelope<{
  videos: ContentRecord[]
}>

export type PlaylistRecord = {
  id: string
  nome: string
  criado_em: string
  itemCount: number
  items: ContentRecord[]
}

export type PublicVideoFeedResponse = ApiEnvelope<{
  videos: ContentRecord[]
  hasMore: boolean
  total?: number
}>



export type PublicCategoryContentResponse = ApiEnvelope<{
  categoria: Category
  videos: ContentRecord[]
}>

export type SavedContentResponse = ApiEnvelope<{
  likedVideos: ContentRecord[]
  playlists: PlaylistRecord[]
}>

export type PlaylistsResponse = ApiEnvelope<{
  playlists: PlaylistRecord[]
}>

export type PlaylistCreateResponse = ApiEnvelope<{
  playlist: PlaylistRecord
}>

export type ToggleLikeResponse = ApiEnvelope<{
  liked: boolean
  likes: number
}>

export type CategoriesResponse = ApiEnvelope<{
  categorias: Category[]
}>

export type CategoryCreateResponse = ApiEnvelope<{
  categoria: Category
}>

export type FetchAlbumResponse = ApiEnvelope<{
  albumUrl: string
  itemCount: number
  coverUrl: string | null
  items: AlbumMediaItem[]
  raw: unknown
}>

export type AdminContentResponse = ApiEnvelope<{
  conteudos: ContentRecord[]
}>
