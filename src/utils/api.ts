import type { SaveVideoNormalInput } from '../../shared/types'
import type {
  AdminContentResponse,
  AuthResponse,
  CategoriesResponse,
  CategoryCreateResponse,
  FetchAlbumResponse,
  PlaylistCreateResponse,
  PlaylistsResponse,
  PublicCategoryContentResponse,
  PublicContentResponse,
  PublicVideoFeedResponse,
  SavedContentResponse,
  ToggleLikeResponse,
} from '../types'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  token?: string | null
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000'

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const payload = (await response.json()) as T & { success?: boolean; error?: string }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || 'request failed')
  }

  return payload
}

export const api = {
  adminLogin: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/admin/login', {
      method: 'POST',
      body: { username, password },
    }),
  register: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { username, password },
    }),
  login: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    }),
  getPublicContent: () => request<PublicContentResponse>('/api/public/conteudos'),
  getRandomVideos: () => request<PublicVideoFeedResponse>('/api/public/videos/random'),
  getVideoFeedPage: (params: { offset?: number; limit?: number }) => {
    const search = new URLSearchParams()
    if (typeof params.offset === 'number') search.set('offset', String(params.offset))
    if (typeof params.limit === 'number') search.set('limit', String(params.limit))
    return request<PublicVideoFeedResponse>(`/api/public/videos?${search.toString()}`)
  },
  getPublicCategories: () => request<CategoriesResponse>('/api/public/categorias'),

  getCategoryContent: (categoryId: string) =>
    request<PublicCategoryContentResponse>(`/api/public/categorias/${categoryId}/conteudos`),
  getSavedContent: (token: string) =>
    request<SavedContentResponse>('/api/public/me/saved', {
      token,
    }),
  getPlaylists: (token: string) =>
    request<PlaylistsResponse>('/api/public/me/playlists', {
      token,
    }),
  createPlaylist: (token: string, name: string) =>
    request<PlaylistCreateResponse>('/api/public/me/playlists', {
      method: 'POST',
      token,
      body: { name },
    }),
  addContentToPlaylists: (token: string, contentId: string, playlistIds: string[]) =>
    request<PlaylistsResponse>('/api/public/me/playlists/add', {
      method: 'POST',
      token,
      body: { contentId, playlistIds },
    }),
  toggleLike: (token: string, contentId: string) =>
    request<ToggleLikeResponse>(`/api/public/conteudos/${contentId}/like`, {
      method: 'POST',
      token,
    }),
  getCategories: (token: string) =>
    request<CategoriesResponse>('/api/admin/categorias', {
      token,
    }),
  getAdminContent: (token: string) =>
    request<AdminContentResponse>('/api/admin/conteudos', {
      token,
    }),
  createCategory: (token: string, nome: string) =>
    request<CategoryCreateResponse>('/api/admin/categorias', {
      method: 'POST',
      token,
      body: { nome },
    }),
  deleteCategory: (token: string, id: string) =>
    request<{ success: true }>(`/api/admin/categorias/${id}`, {
      method: 'DELETE',
      token,
    }),
  deleteContents: (token: string, ids: string[]) =>
    request<{ success: true }>('/api/admin/conteudos', {
      method: 'DELETE',
      token,
      body: { ids },
    }),
  fetchAlbum: (token: string, url: string) =>
    request<FetchAlbumResponse>('/api/admin/fetch-album', {
      method: 'POST',
      token,
      body: { url },
    }),
  saveVideoNormal: (token: string, body: SaveVideoNormalInput) =>
    request<{ success: true }>('/api/admin/conteudos/video-normal', {
      method: 'POST',
      token,
      body,
    }),

}
