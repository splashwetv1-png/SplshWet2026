import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { Category, ContentRecord } from '../../shared/types'
import type { PlaylistRecord } from '@/types'
import { useAuthStore } from '@/store/useAuthStore'
import { api } from '@/utils/api'
import { proxiedMediaUrl } from '@/utils/media'
import {
  Bookmark,
  Heart,
  Home as HomeIcon,
  Plus,
  Search,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react'

type TabKey = 'home' | 'saved' | 'categories' | 'profile'
type SavedTabKey = 'liked' | 'playlists'

type SavedState = {
  likedVideos: ContentRecord[]
  playlists: PlaylistRecord[]
}


type CategoryCardTheme = {
  accent: string
  secondary: string
  spotlight: string
  background: string
}

const INITIAL_SAVED_STATE: SavedState = {
  likedVideos: [],
  playlists: [],
}

const CATEGORY_CARD_THEMES: CategoryCardTheme[] = [
  {
    accent: '#00fff7',
    secondary: '#0f172a',
    spotlight: 'rgba(0, 255, 247, 0.32)',
    background:
      'linear-gradient(160deg, rgba(0,255,247,0.24) 0%, rgba(12,18,28,0.94) 42%, rgba(0,0,0,1) 100%)',
  },
  {
    accent: '#ff1e9d',
    secondary: '#1f0b1a',
    spotlight: 'rgba(255, 30, 157, 0.3)',
    background:
      'linear-gradient(160deg, rgba(255,30,157,0.24) 0%, rgba(25,11,24,0.94) 45%, rgba(0,0,0,1) 100%)',
  },
  {
    accent: '#8b5cf6',
    secondary: '#1c1633',
    spotlight: 'rgba(139, 92, 246, 0.28)',
    background:
      'linear-gradient(160deg, rgba(139,92,246,0.26) 0%, rgba(18,18,36,0.94) 44%, rgba(0,0,0,1) 100%)',
  },
  {
    accent: '#f59e0b',
    secondary: '#2b1805',
    spotlight: 'rgba(245, 158, 11, 0.28)',
    background:
      'linear-gradient(160deg, rgba(245,158,11,0.24) 0%, rgba(30,19,8,0.94) 45%, rgba(0,0,0,1) 100%)',
  },
]

function getCategoryCardTheme(categoryName: string) {
  const hash = Array.from(categoryName).reduce((total, character, index) => total + character.charCodeAt(0) * (index + 1), 0)
  return CATEGORY_CARD_THEMES[hash % CATEGORY_CARD_THEMES.length]
}

function isImageUrl(value: string | null | undefined) {
  return !!value && /\.(jpg|jpeg|png|gif|webp)$/i.test(value)
}

function formatCompactCount(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}




function getCardPreviewUrl(item: ContentRecord) {
  if (item.url_capa) {
    return proxiedMediaUrl(item.url_capa)
  }


  return proxiedMediaUrl(item.url_video)
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="border border-zinc-800 bg-[#050505] px-4 py-10 text-center">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-xs text-zinc-500">{description}</p>
    </div>
  )
}

function ShellHeader({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return (
    <div className="border-b border-zinc-900 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#00fff7]">{eyebrow}</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="text-2xl font-black leading-none text-white">{title}</h1>
            {detail ? <p className="max-w-[10rem] text-right text-[11px] text-zinc-500">{detail}</p> : null}
          </div>
        </div>

        <img
          src="/splashwet-logo.png"
          alt="SplashWet"
          className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_0_28px_rgba(255,30,157,0.22)]"
        />
      </div>
    </div>
  )
}


function FeedProgressBar({
  currentTime,
  duration,
  onSeek,
}: {
  currentTime: number
  duration: number
  onSeek: (nextTime: number) => void
}) {
  const railRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const pointerIdRef = useRef<number | null>(null)

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  useEffect(() => {
    if (!dragging) {
      return undefined
    }

    function updateFromClientX(clientX: number) {
      if (!railRef.current || duration <= 0) {
        return
      }

      const bounds = railRef.current.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width))
      onSeek(ratio * duration)
    }

    const handleMove = (event: PointerEvent) => {
      updateFromClientX(event.clientX)
    }

    const handleEnd = () => {
      setDragging(false)
      pointerIdRef.current = null
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleEnd)
    window.addEventListener('pointercancel', handleEnd)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleEnd)
      window.removeEventListener('pointercancel', handleEnd)
    }
  }, [dragging, duration, onSeek])

  return (
    <div
      ref={railRef}
      className="relative h-2 w-full touch-none cursor-pointer bg-zinc-800"
      onPointerDown={(event) => {
        if (duration <= 0) {
          return
        }

        const bounds = event.currentTarget.getBoundingClientRect()
        const ratio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))
        onSeek(ratio * duration)
        setDragging(true)
        pointerIdRef.current = event.pointerId
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
    >
      <div className="absolute inset-y-0 left-0 bg-[#ff1e9d]" style={{ width: `${progress}%` }} />
    </div>
  )
}

function VideoFeedCard({
  item,
  isLiked,
  muted,
  viewerMode = false,
  onToggleMuted,
  onToggleLike,
  onOpenPlaylistModal,
}: {
  item: ContentRecord
  isLiked: boolean
  muted: boolean
  viewerMode?: boolean
  onToggleMuted: () => void
  onToggleLike: (contentId: string) => Promise<void>
  onOpenPlaylistModal: (item: ContentRecord) => void
}) {
  const articleRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isActive, setIsActive] = useState(false)

  const mediaUrl = proxiedMediaUrl(item.url_video)
  const posterUrl = proxiedMediaUrl(item.url_capa)
  // Fallback URL used if the proxy request fails in production
  const fallbackMediaUrl = item.url_video ?? undefined

  useEffect(() => {
    const node = articleRef.current

    if (!node) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting && entry.intersectionRatio > 0.65)
      },
      {
        threshold: [0.35, 0.65, 0.85],
      },
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = videoRef.current

    if (!element) {
      return
    }

    element.muted = muted

    if (isActive) {
      void element.play().catch(() => undefined)
      return
    }

    element.pause()
  }, [isActive, muted])

  return (
    <article
      ref={articleRef}
      className={`relative snap-start overflow-hidden bg-black ${
        viewerMode ? 'h-[100dvh]' : 'h-[var(--feed-viewport-height)] border-b border-zinc-950'
      }`}
    >
      <video
        ref={videoRef}
        src={mediaUrl}
        poster={posterUrl}
        playsInline
        preload="metadata"
        muted={muted}
        loop
        className="relative z-[1] h-full w-full bg-transparent object-contain object-center"
        onError={(e) => {
          if (fallbackMediaUrl && e.currentTarget.src !== fallbackMediaUrl) {
            e.currentTarget.src = fallbackMediaUrl
          }
        }}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0)
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime || 0)
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black via-transparent to-transparent" />

      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="border border-zinc-800 bg-black/80 px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-[#00fff7]">
          Random Feed
        </div>
        <button
          type="button"
          onClick={onToggleMuted}
          className="flex h-11 w-11 items-center justify-center border border-zinc-700 bg-black/80 text-white"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      <div
        className={`absolute inset-x-0 z-10 px-4 pb-1 pt-3 ${
          viewerMode ? 'bottom-[max(1rem,env(safe-area-inset-bottom))]' : 'bottom-[var(--bottom-nav-total)]'
        }`}
      >
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-[70%]">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#00fff7]">Video</p>
            <p className="mt-2 text-sm leading-5 text-white">{item.descricao || 'Untitled video'}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void onToggleLike(item.id)}
              className={`flex h-12 w-12 items-center justify-center border text-white ${
                isLiked ? 'border-[#ff1e9d] bg-[#ff1e9d] text-black' : 'border-zinc-700 bg-black/80'
              }`}
            >
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={() => onOpenPlaylistModal(item)}
              className="flex h-12 w-12 items-center justify-center border border-zinc-700 bg-black/80 text-white"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <FeedProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={(nextTime) => {
              if (videoRef.current) {
                videoRef.current.currentTime = nextTime
                setCurrentTime(nextTime)
              }
            }}
          />
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>{formatCompactCount(item.likes)} Likes</span>
            <span>{duration > 0 ? `${Math.floor(currentTime)}s / ${Math.floor(duration)}s` : 'Loading video'}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

function ContentTile({
  item,
  accent = 'cyan',
  onClick,
}: {
  item: ContentRecord
  accent?: 'cyan' | 'pink'
  onClick?: () => void
}) {
  const previewUrl = getCardPreviewUrl(item)
  // Fallback: original unproxied URL for when the proxy request fails
  const fallbackPreviewUrl = item.url_capa ?? item.url_video ?? undefined
  const accentClass = accent === 'pink' ? 'text-[#ff1e9d]' : 'text-[#00fff7]'

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col overflow-hidden border border-zinc-800 bg-[#050505] text-left"
    >
      <div className="aspect-square border-b border-zinc-800 bg-black">
        {previewUrl ? (
          isImageUrl(previewUrl) ? (
            <img
              src={previewUrl}
              alt={item.descricao || 'Preview'}
              className="h-full w-full object-cover"
              onError={(e) => {
                if (fallbackPreviewUrl && e.currentTarget.src !== fallbackPreviewUrl) {
                  e.currentTarget.src = fallbackPreviewUrl
                }
              }}
            />
          ) : (
            <video
              src={previewUrl}
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
              onError={(e) => {
                if (fallbackPreviewUrl && e.currentTarget.src !== fallbackPreviewUrl) {
                  e.currentTarget.src = fallbackPreviewUrl
                }
              }}
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-600">No Preview</div>
        )}
      </div>
      <div className="space-y-2 p-3">
        <p className={`text-[11px] uppercase tracking-[0.28em] ${accentClass}`}>
          Video
        </p>
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-white">{item.descricao || 'Untitled item'}</p>
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span>{formatCompactCount(item.likes)} Likes</span>
          <span>{formatCompactCount(item.visualizacoes)} Views</span>
        </div>
      </div>
    </button>
  )
}


function VideoFeedScroller({
  videos,
  likedIds,
  muted,
  viewerMode = false,
  onToggleMuted,
  onToggleLike,
  onOpenPlaylistModal,
  initialIndex = 0,
}: {
  videos: ContentRecord[]
  likedIds: Set<string>
  muted: boolean
  viewerMode?: boolean
  onToggleMuted: () => void
  onToggleLike: (contentId: string) => Promise<void>
  onOpenPlaylistModal: (item: ContentRecord) => void
  initialIndex?: number
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container || initialIndex < 0 || initialIndex >= videos.length) {
      return
    }

    const target = container.children.item(initialIndex)

    if (!(target instanceof HTMLElement)) {
      return
    }

    window.requestAnimationFrame(() => {
      target.scrollIntoView({
        block: 'start',
        behavior: 'auto',
      })
    })
  }, [initialIndex, videos.length])

  return (
    <div
      ref={containerRef}
      className={`snap-y snap-mandatory overflow-y-auto overscroll-y-contain ${
        viewerMode ? 'h-[100dvh] overscroll-none' : 'h-[var(--feed-viewport-height)]'
      }`}
    >
      {videos.map((item) => (
        <VideoFeedCard
          key={item.id}
          item={item}
          isLiked={likedIds.has(item.id)}
          muted={muted}
          viewerMode={viewerMode}
          onToggleMuted={onToggleMuted}
          onToggleLike={onToggleLike}
          onOpenPlaylistModal={onOpenPlaylistModal}
        />
      ))}
    </div>
  )
}



function HomeSection({
  likedIds,
  muted,
  onToggleMuted,
  onToggleLike,
  onOpenPlaylistModal,
}: {
  likedIds: Set<string>
  muted: boolean
  onToggleMuted: () => void
  onToggleLike: (contentId: string) => Promise<void>
  onOpenPlaylistModal: (item: ContentRecord) => void
}) {
  const [videos, setVideos] = useState<ContentRecord[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const videosRef = useRef<ContentRecord[]>([])
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    videosRef.current = videos
  }, [videos])

  const loadVideos = useCallback(async (reset: boolean) => {
    try {
      if (reset) {
        setStatus('loading')
        setErrorMessage('')
        setHasMore(true)
      } else {
        setLoadingMore(true)
      }

      const response = await api.getVideoFeedPage({
        offset: reset ? 0 : videosRef.current.length,
        limit: 5,
      })

      setVideos((current) => (reset ? response.videos : [...current, ...response.videos]))
      setHasMore(response.hasMore)
      if (reset) setStatus('ready')
    } catch (error) {
      if (reset) {
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load the video feed.')
      }
    } finally {
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    void loadVideos(true)
  }, [loadVideos])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || status !== 'ready' || loadingMore || !hasMore) return
        void loadVideos(false)
      },
      { rootMargin: '300px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadVideos, loadingMore, status])

  if (status === 'loading') {
    return (
      <div className="flex h-[var(--feed-viewport-height)] items-center justify-center px-6 text-center text-sm text-zinc-500">
        Loading randomized videos from Supabase.
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex h-[var(--feed-viewport-height)] items-center justify-center px-6 text-center text-sm text-zinc-500">
        {errorMessage || 'Failed to load the video feed.'}
      </div>
    )
  }

  if (!videos.length) {
    return (
      <div className="flex h-[var(--feed-viewport-height)] items-center justify-center px-6 text-center text-sm text-zinc-500">
        No videos are available yet.
      </div>
    )
  }

  return (
    <>
      <VideoFeedScroller
        videos={videos}
        likedIds={likedIds}
        muted={muted}
        onToggleMuted={onToggleMuted}
        onToggleLike={onToggleLike}
        onOpenPlaylistModal={onOpenPlaylistModal}
      />
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      {loadingMore && (
        <div className="flex items-center justify-center py-3 text-xs text-zinc-500">
          Loading more…
        </div>
      )}
    </>
  )
}


function SavedSection({
  isAuthenticated,
  saved,
  likedIds,
  muted,
  onToggleMuted,
  onToggleLike,
  onOpenPlaylistModal,
  onCreatePlaylist,
}: {
  isAuthenticated: boolean
  saved: SavedState
  likedIds: Set<string>
  muted: boolean
  onToggleMuted: () => void
  onToggleLike: (contentId: string) => Promise<void>
  onOpenPlaylistModal: (item: ContentRecord) => void
  onCreatePlaylist: (name: string) => Promise<void>
}) {
  const [tab, setTab] = useState<SavedTabKey>('liked')
  const [playlistName, setPlaylistName] = useState('')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [viewerVideos, setViewerVideos] = useState<ContentRecord[]>([])
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const selectedPlaylist = saved.playlists.find((playlist) => playlist.id === selectedPlaylistId) || null

  useEffect(() => {
    if (selectedVideoIndex === null) {
      return undefined
    }

    const scrollY = window.scrollY
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyLeft = document.body.style.left
    const previousBodyRight = document.body.style.right
    const previousBodyWidth = document.body.style.width
    const previousBodyOverscroll = document.body.style.overscrollBehavior

    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overscrollBehavior = 'none'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.left = previousBodyLeft
      document.body.style.right = previousBodyRight
      document.body.style.width = previousBodyWidth
      document.body.style.overscrollBehavior = previousBodyOverscroll
      window.scrollTo(0, scrollY)
    }
  }, [selectedVideoIndex])

  const openSavedItem = useCallback((item: ContentRecord, sourceItems: ContentRecord[]) => {
    const nextIndex = sourceItems.findIndex((entry) => entry.id === item.id)

    if (nextIndex < 0) {
      return
    }

    setViewerVideos(sourceItems)
    setSelectedVideoIndex(nextIndex)
  }, [])

  if (!isAuthenticated) {
    return (
      <section className="pb-24">
        <ShellHeader eyebrow="Saved" title="Your Library" detail="Sign in to access your likes and playlists." />
        <div className="px-4 pt-6">
          <EmptyState
            title="Sign In Required"
            description="Please log in to view your saved content."
          />
        </div>
      </section>
    )
  }


  if (selectedVideoIndex !== null) {
    return (
      <section className="fixed inset-0 z-50 h-[100dvh] w-screen overflow-hidden bg-black overscroll-none">
        <div className="absolute inset-x-0 top-0 z-20 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => setSelectedVideoIndex(null)}
            className="border border-zinc-800 bg-black/80 px-4 py-3 text-sm font-semibold text-white"
          >
            Back To Saved
          </button>
        </div>

        <VideoFeedScroller
          videos={viewerVideos}
          likedIds={likedIds}
          muted={muted}
          viewerMode
          onToggleMuted={onToggleMuted}
          onToggleLike={onToggleLike}
          onOpenPlaylistModal={onOpenPlaylistModal}
          initialIndex={selectedVideoIndex}
        />
      </section>
    )
  }

  return (
    <section className="pb-24">
      <ShellHeader eyebrow="Saved" title="Playlists And Likes" detail="Keep your favorite videos and playlists in one place." />

      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTab('liked')}
            className={`border px-4 py-3 text-sm font-semibold ${
              tab === 'liked' ? 'border-[#ff1e9d] bg-[#ff1e9d] text-black' : 'border-zinc-800 bg-black text-zinc-300'
            }`}
          >
            Liked Videos
          </button>
          <button
            type="button"
            onClick={() => setTab('playlists')}
            className={`border px-4 py-3 text-sm font-semibold ${
              tab === 'playlists' ? 'border-[#00fff7] bg-[#00fff7] text-black' : 'border-zinc-800 bg-black text-zinc-300'
            }`}
          >
            My Playlists
          </button>
        </div>

        {tab === 'liked' ? (
          <div className="pt-4">
            {saved.likedVideos.length ? (
              <div className="grid grid-cols-2 gap-3">
                {saved.likedVideos.map((item) => (
                  <ContentTile key={item.id} item={item} accent="pink" onClick={() => openSavedItem(item, saved.likedVideos)} />
                ))}
              </div>
            ) : (
              <EmptyState title="No Liked Videos" description="Tap the heart on any video to save it here." />
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault()

                if (!playlistName.trim()) {
                  return
                }

                setSubmitting(true)
                void onCreatePlaylist(playlistName)
                  .then(() => {
                    setPlaylistName('')
                    setMessage('Playlist created.')
                  })
                  .catch((error: Error) => {
                    setMessage(error.message || 'Failed to create the playlist.')
                  })
                  .finally(() => {
                    setSubmitting(false)
                  })
              }}
            >
              <input
                value={playlistName}
                onChange={(event) => setPlaylistName(event.target.value)}
                placeholder="New playlist name"
                className="flex-1 border border-zinc-800 bg-black px-3 py-3 text-sm text-white outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="border border-[#00fff7] bg-[#00fff7] px-4 py-3 text-sm font-semibold text-black disabled:opacity-40"
              >
                Create
              </button>
            </form>

            {message ? <p className="text-xs text-zinc-400">{message}</p> : null}

            {saved.playlists.length ? (
              <div className="space-y-3">
                {saved.playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() => setSelectedPlaylistId((current) => (current === playlist.id ? null : playlist.id))}
                    className="w-full border border-zinc-800 bg-[#050505] p-4 text-left"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-[#00fff7]">Playlist</p>
                        <p className="mt-2 text-sm font-semibold text-white">{playlist.nome}</p>
                      </div>
                      <p className="text-xs text-zinc-500">{playlist.itemCount} Items</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="No Playlists Yet" description="Create your first playlist to start saving videos." />
            )}

            {selectedPlaylist ? (
              <div className="space-y-3 border border-zinc-800 bg-black p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[#ff1e9d]">Playlist Details</p>
                    <h3 className="mt-2 text-lg font-black text-white">{selectedPlaylist.nome}</h3>
                  </div>
                  <p className="text-xs text-zinc-500">{selectedPlaylist.itemCount} Items</p>
                </div>

                {selectedPlaylist.items.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedPlaylist.items.map((item) => (
                      <ContentTile key={item.id} item={item} onClick={() => openSavedItem(item, selectedPlaylist.items)} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Playlist Is Empty" description="Use Add to Playlist from the feed to save videos here." />
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}

function CategoriesSection({
  categories,
  likedIds,
  muted,
  onToggleMuted,
  onToggleLike,
  onOpenPlaylistModal,
}: {
  categories: Category[]
  likedIds: Set<string>
  muted: boolean
  onToggleMuted: () => void
  onToggleLike: (contentId: string) => Promise<void>
  onOpenPlaylistModal: (item: ContentRecord) => void
}) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [videos, setVideos] = useState<ContentRecord[]>([])
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (selectedVideoIndex === null) {
      return undefined
    }

    const scrollY = window.scrollY
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyLeft = document.body.style.left
    const previousBodyRight = document.body.style.right
    const previousBodyWidth = document.body.style.width
    const previousBodyOverscroll = document.body.style.overscrollBehavior

    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overscrollBehavior = 'none'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.left = previousBodyLeft
      document.body.style.right = previousBodyRight
      document.body.style.width = previousBodyWidth
      document.body.style.overscrollBehavior = previousBodyOverscroll
      window.scrollTo(0, scrollY)
    }
  }, [selectedVideoIndex])

  const openCategory = async (category: Category) => {
    setSelectedCategory(category)
    setLoading(true)
    setErrorMessage('')

    try {
      const response = await api.getCategoryContent(category.id)
      setVideos(response.videos)
      setSelectedVideoIndex(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load category content.')
    } finally {
      setLoading(false)
    }
  }


  if (selectedCategory && selectedVideoIndex !== null) {
    return (
      <section className="fixed inset-0 z-50 h-[100dvh] w-screen overflow-hidden bg-black overscroll-none">
        <div className="absolute inset-x-0 top-0 z-20 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => setSelectedVideoIndex(null)}
            className="border border-zinc-800 bg-black/80 px-4 py-3 text-sm font-semibold text-white"
          >
            Back To Category
          </button>
        </div>

        <VideoFeedScroller
          videos={videos}
          likedIds={likedIds}
          muted={muted}
          viewerMode
          onToggleMuted={onToggleMuted}
          onToggleLike={onToggleLike}
          onOpenPlaylistModal={onOpenPlaylistModal}
          initialIndex={selectedVideoIndex}
        />
      </section>
    )
  }

  return (
    <section className="pb-24">
      <ShellHeader eyebrow="Categories" title="Browse Categories" detail="Discover videos and sequel albums by theme." />

      <div className="space-y-4 px-4 pt-4">
        {selectedCategory ? (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory(null)
              setVideos([])
              setSelectedVideoIndex(null)
            }}
            className="border border-zinc-800 bg-black px-4 py-3 text-sm font-semibold text-white"
          >
            Back To Categories
          </button>
        ) : null}

        {!selectedCategory ? (
          categories.length ? (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const theme = getCategoryCardTheme(category.nome)

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => void openCategory(category)}
                    className="group relative aspect-square overflow-hidden border border-zinc-800 bg-[#050505] p-4 text-left transition duration-300 hover:border-zinc-500"
                  >
                    <div className="absolute inset-0" style={{ background: theme.background }} />
                    <div
                      className="absolute -right-8 top-0 h-28 w-28 rounded-full blur-3xl transition duration-300 group-hover:scale-110"
                      style={{ background: theme.spotlight }}
                    />
                    <div
                      className="absolute inset-0 opacity-60"
                      style={{
                        background: `linear-gradient(135deg, transparent 0%, ${theme.secondary} 52%, rgba(0, 0, 0, 0.96) 100%)`,
                      }}
                    />
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background:
                          'repeating-linear-gradient(135deg, rgba(255,255,255,0.16) 0 2px, transparent 2px 14px)',
                      }}
                    />
                    <div
                      className="absolute bottom-4 right-4 h-16 w-16 rounded-full border opacity-80"
                      style={{ borderColor: `${theme.accent}66` }}
                    />
                    <div
                      className="absolute bottom-8 right-8 h-9 w-9 rounded-full border opacity-60"
                      style={{ borderColor: `${theme.accent}55` }}
                    />

                    <div className="relative flex h-full flex-col justify-between">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: theme.accent }}>
                          Category
                        </p>
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.accent }} />
                      </div>

                      <div className="space-y-3">
                        <p className="max-w-[85%] text-xl font-black leading-tight text-white transition duration-300 group-hover:translate-y-[-2px]">
                          {category.nome}
                        </p>
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-zinc-300">
                          <span>Explore</span>
                          <span style={{ color: theme.accent }}>Open</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <EmptyState title="No Categories" description="Create categories in the admin panel to populate this screen." />
          )
        ) : loading ? (
          <div className="py-16 text-center text-sm text-zinc-500">Loading category content.</div>
        ) : errorMessage ? (
          <EmptyState title="Load Failed" description={errorMessage} />
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#00fff7]">Selected Category</p>
              <h2 className="mt-2 text-2xl font-black text-white">{selectedCategory.nome}</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">Videos</h3>
                <p className="text-xs text-zinc-500">{videos.length} Items</p>
              </div>
              {videos.length ? (
                <div className="grid grid-cols-2 gap-3">
                  {videos.map((item, index) => (
                    <ContentTile key={item.id} item={item} onClick={() => setSelectedVideoIndex(index)} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No Videos" description="This category currently has no individual videos." />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function ProfileSection({
  isAuthenticated,
  username,
  initialMode,
  onLogin,
  onRegister,
  onLogout,
}: {
  isAuthenticated: boolean
  username: string | null
  initialMode?: 'signin' | 'create'
  onLogin: (username: string, password: string) => Promise<void>
  onRegister: (username: string, password: string) => Promise<void>
  onLogout: () => void
}) {
  const [mode, setMode] = useState<'signin' | 'create'>(initialMode || 'signin')
  const [formState, setFormState] = useState({
    username: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode)
    }
  }, [initialMode])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      if (mode === 'signin') {
        await onLogin(formState.username, formState.password)
        setMessage('You are now signed in.')
      } else {
        await onRegister(formState.username, formState.password)
        setMessage('Your account has been created.')
      }

      setFormState({
        username: '',
        password: '',
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isAuthenticated) {
    return (
      <section className="pb-24">
        <ShellHeader eyebrow="Profile" title="Anonymous Account" detail="Manage your account and access your saved content." />

        <div className="space-y-4 px-4 pt-6">
          <div className="border border-zinc-800 bg-[#050505] p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#00fff7]">Session</p>
            <p className="mt-3 text-lg font-semibold text-white">Logged in as {username}</p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full border border-[#ff1e9d] bg-[#ff1e9d] px-4 py-4 text-sm font-semibold text-black"
          >
            Sign Out
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="pb-24">
      <ShellHeader eyebrow="Profile" title="Sign In Or Create Account" detail="Sign in to like videos and save playlists." />

      <div className="space-y-4 px-4 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`border px-4 py-3 text-sm font-semibold ${
              mode === 'signin' ? 'border-[#00fff7] bg-[#00fff7] text-black' : 'border-zinc-800 bg-black text-zinc-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`border px-4 py-3 text-sm font-semibold ${
              mode === 'create' ? 'border-[#ff1e9d] bg-[#ff1e9d] text-black' : 'border-zinc-800 bg-black text-zinc-300'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3 border border-zinc-800 bg-[#050505] p-4">
          <label className="block space-y-2">
            <span className="text-xs font-semibold text-zinc-300">Username</span>
            <input
              value={formState.username}
              onChange={(event) => setFormState((current) => ({ ...current, username: event.target.value }))}
              className="w-full border border-zinc-800 bg-black px-3 py-3 text-sm text-white outline-none"
              placeholder="Username"
              autoComplete="username"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold text-zinc-300">Password</span>
            <input
              type="password"
              value={formState.password}
              onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
              className="w-full border border-zinc-800 bg-black px-3 py-3 text-sm text-white outline-none"
              placeholder="Password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>

          <div className="border border-zinc-800 bg-black p-3 text-xs leading-5 text-zinc-400">
            Keep your password safe. Account recovery is not available without an email.
          </div>

          {message ? <p className="text-xs text-zinc-400">{message}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full border border-[#00fff7] bg-[#00fff7] px-4 py-4 text-sm font-semibold text-black disabled:opacity-40"
          >
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </section>
  )
}

function PlaylistModal({
  item,
  playlists,
  onClose,
  onCreatePlaylist,
  onSubmit,
}: {
  item: ContentRecord
  playlists: PlaylistRecord[]
  onClose: () => void
  onCreatePlaylist: (name: string) => Promise<void>
  onSubmit: (playlistIds: string[]) => Promise<void>
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [playlistName, setPlaylistName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4">
      <div className="w-full max-w-[26rem] border border-zinc-700 bg-black p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#ff1e9d]">Add To Playlist</p>
            <h3 className="mt-2 text-xl font-black text-white">{item.descricao || 'Current video'}</h3>
          </div>
          <button type="button" onClick={onClose} className="border border-zinc-700 px-3 py-2 text-xs text-white">
            Close
          </button>
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()

            if (!playlistName.trim()) {
              return
            }

            setSubmitting(true)
            void onCreatePlaylist(playlistName)
              .then(() => {
                setPlaylistName('')
                setMessage('Playlist created. Select it below to add this video.')
              })
              .catch((error: Error) => {
                setMessage(error.message || 'Failed to create the playlist.')
              })
              .finally(() => {
                setSubmitting(false)
              })
          }}
        >
          <input
            value={playlistName}
            onChange={(event) => setPlaylistName(event.target.value)}
            placeholder="Create playlist"
            className="flex-1 border border-zinc-800 bg-[#050505] px-3 py-3 text-sm text-white outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="border border-[#00fff7] bg-[#00fff7] px-4 py-3 text-sm font-semibold text-black disabled:opacity-40"
          >
            Create
          </button>
        </form>

        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
          {playlists.length ? (
            playlists.map((playlist) => {
              const checked = selectedIds.includes(playlist.id)

              return (
                <label key={playlist.id} className="flex cursor-pointer items-center justify-between border border-zinc-800 bg-[#050505] px-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{playlist.nome}</p>
                    <p className="text-xs text-zinc-500">{playlist.itemCount} Items</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      setSelectedIds((current) =>
                        event.target.checked ? [...current, playlist.id] : current.filter((id) => id !== playlist.id),
                      )
                    }}
                    className="h-4 w-4 border border-zinc-700 bg-black"
                  />
                </label>
              )
            })
          ) : (
            <EmptyState title="No Playlists Yet" description="Create a playlist first, then select it to save this video." />
          )}
        </div>

        {message ? <p className="mt-3 text-xs text-zinc-400">{message}</p> : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="border border-zinc-700 px-4 py-3 text-sm font-semibold text-white">
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedIds.length || submitting}
            onClick={() => {
              setSubmitting(true)
              void onSubmit(selectedIds)
                .then(() => {
                  setMessage('Video added to the selected playlists.')
                  onClose()
                })
                .catch((error: Error) => {
                  setMessage(error.message || 'Failed to update playlists.')
                })
                .finally(() => {
                  setSubmitting(false)
                })
            }}
            className="border border-[#ff1e9d] bg-[#ff1e9d] px-4 py-3 text-sm font-semibold text-black disabled:opacity-40"
          >
            Save Selection
          </button>
        </div>
      </div>
    </div>
  )
}

function BottomTabBar({
  activeTab,
  onChange,
}: {
  activeTab: TabKey
  onChange: (tab: TabKey) => void
}) {
  const tabs: Array<{ key: TabKey; label: string; icon: typeof HomeIcon }> = [
    { key: 'home', label: 'Home', icon: HomeIcon },
    { key: 'saved', label: 'Saved', icon: Bookmark },
    { key: 'categories', label: 'Categories', icon: Search },
    { key: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 grid h-[var(--bottom-nav-total)] w-full max-w-[430px] -translate-x-1/2 grid-cols-4 border-t border-zinc-800 bg-black px-0 pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.key

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex h-[var(--bottom-nav-height)] flex-col items-center justify-center gap-1 px-2 py-3 text-[10px] font-semibold ${
              isActive ? 'text-white' : 'text-zinc-500'
            }`}
          >
            <Icon size={18} className={isActive ? (tab.key === 'home' || tab.key === 'saved' ? 'text-[#ff1e9d]' : 'text-[#00fff7]') : ''} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default function Home() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const logout = useAuthStore((state) => state.logout)

  const [activeTab, setActiveTab] = useState<TabKey>('home')
  const [profileMode, setProfileMode] = useState<'signin' | 'create'>('signin')
  const [muted, setMuted] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [saved, setSaved] = useState<SavedState>(INITIAL_SAVED_STATE)
  const [playlistModalItem, setPlaylistModalItem] = useState<ContentRecord | null>(null)
  const [bannerMessage, setBannerMessage] = useState('')

  const isAuthenticated = !!token && user?.role === 'user'
  const likedIds = useMemo(() => new Set(saved.likedVideos.map((item) => item.id)), [saved.likedVideos])

  useEffect(() => {
    let mounted = true

    void api
      .getPublicCategories()
      .then((response) => {
        if (mounted) {
          setCategories(response.categorias)
        }
      })
      .catch(() => undefined)

    return () => {
      mounted = false
    }
  }, [])

  const loadSavedContent = useCallback(async () => {
    if (!token || user?.role !== 'user') {
      setSaved(INITIAL_SAVED_STATE)
      return
    }

    const response = await api.getSavedContent(token)
    setSaved({
      likedVideos: response.likedVideos,
      playlists: response.playlists,
    })
  }, [token, user?.role])

  useEffect(() => {
    void loadSavedContent().catch(() => undefined)
  }, [loadSavedContent])

  useEffect(() => {
    if (!bannerMessage) {
      return undefined
    }

    const timeout = window.setTimeout(() => setBannerMessage(''), 2600)
    return () => window.clearTimeout(timeout)
  }, [bannerMessage])

  const requireUser = useCallback(
    (message: string) => {
      if (isAuthenticated && token) {
        return true
      }

      setProfileMode('signin')
      setBannerMessage(message)
      setActiveTab('profile')
      return false
    },
    [isAuthenticated, token],
  )

  const handleLogin = async (username: string, password: string) => {
    const response = await api.login(username, password)
    setSession(response.token, response.user)
    setActiveTab('saved')
    setBannerMessage('Signed in successfully.')
  }

  const handleRegister = async (username: string, password: string) => {
    const response = await api.register(username, password)
    setSession(response.token, response.user)
    setActiveTab('saved')
    setBannerMessage('Account created successfully.')
  }

  const handleCreatePlaylist = async (name: string) => {
    if (!token || !requireUser('Please sign in to manage playlists.')) {
      return
    }

    await api.createPlaylist(token, name)
    await loadSavedContent()
    setBannerMessage('Playlist created.')
  }

  const handleAddToPlaylists = async (contentId: string, playlistIds: string[]) => {
    if (!token || !requireUser('Please sign in to use playlists.')) {
      return
    }

    await api.addContentToPlaylists(token, contentId, playlistIds)
    await loadSavedContent()
    setBannerMessage('Video added to playlists.')
  }

  const handleToggleLike = async (contentId: string) => {
    if (!token) {
      setProfileMode('signin')
      setBannerMessage('Please sign in or create an account to like videos.')
      setActiveTab('profile')
      return
    }

    if (!requireUser('Please sign in or create an account to like videos.')) {
      return
    }

    await api.toggleLike(token, contentId)
    await loadSavedContent()
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto min-h-screen max-w-[430px] border-x border-zinc-900 bg-black">
        {activeTab === 'home' ? (
          <HomeSection
            likedIds={likedIds}
            muted={muted}
            onToggleMuted={() => setMuted((current) => !current)}
            onToggleLike={handleToggleLike}
            onOpenPlaylistModal={(item) => {
              if (!requireUser('Please sign in to use playlists.')) {
                return
              }

              setPlaylistModalItem(item)
            }}
          />
        ) : null}


        {activeTab === 'saved' ? (
          <SavedSection
            isAuthenticated={isAuthenticated}
            saved={saved}
            likedIds={likedIds}
            muted={muted}
            onToggleMuted={() => setMuted((current) => !current)}
            onToggleLike={handleToggleLike}
            onOpenPlaylistModal={(item) => {
              if (!requireUser('Please sign in to use playlists.')) {
                return
              }

              setPlaylistModalItem(item)
            }}
            onCreatePlaylist={handleCreatePlaylist}
          />
        ) : null}

        {activeTab === 'categories' ? (
          <CategoriesSection
            categories={categories}
            likedIds={likedIds}
            muted={muted}
            onToggleMuted={() => setMuted((current) => !current)}
            onToggleLike={handleToggleLike}
            onOpenPlaylistModal={(item) => {
              if (!requireUser('Please sign in to use playlists.')) {
                return
              }

              setPlaylistModalItem(item)
            }}
          />
        ) : null}

        {activeTab === 'profile' ? (
          <ProfileSection
            isAuthenticated={isAuthenticated}
            username={user?.username || null}
            initialMode={profileMode}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onLogout={() => {
              logout()
              setSaved(INITIAL_SAVED_STATE)
              setBannerMessage('Signed out successfully.')
            }}
          />
        ) : null}
      </div>

      <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />

      {playlistModalItem ? (
        <PlaylistModal
          item={playlistModalItem}
          playlists={saved.playlists}
          onClose={() => setPlaylistModalItem(null)}
          onCreatePlaylist={handleCreatePlaylist}
          onSubmit={async (playlistIds) => {
            await handleAddToPlaylists(playlistModalItem.id, playlistIds)
          }}
        />
      ) : null}

      {bannerMessage ? (
        <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 border border-zinc-700 bg-black px-4 py-3 text-center text-xs text-zinc-300">
          {bannerMessage}
        </div>
      ) : null}
    </main>
  )
}
