import { useEffect, useMemo, useState } from 'react'
import type { ContentRecord } from '../../shared/types'
import ConfirmModal from '@/components/ConfirmModal'
import { proxiedMediaUrl } from '@/utils/media'
import { api } from '@/utils/api'

type ContentManagerProps = {
  token: string
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

type ContentFilter = 'all' | 'normal'

function typeLabel(item: ContentRecord) {
  if (item.tipo === 'photo_normal') {
    return 'image'
  }

  return 'video'
}

function matchesFilter(item: ContentRecord, filter: ContentFilter) {
  if (filter === 'all') {
    return true
  }



  return item.tipo === 'video_normal' || item.tipo === 'photo_normal'
}

export default function ContentManager({ token, onSuccess, onError }: ContentManagerProps) {
  const [items, setItems] = useState<ContentRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<ContentFilter>('all')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const filteredItems = useMemo(() => items.filter((item) => matchesFilter(item, activeFilter)), [items, activeFilter])

  const selectedCount = selectedIds.length
  const visibleSelectedCount = filteredItems.filter((item) => selectedIds.includes(item.id)).length
  const allSelected = filteredItems.length > 0 && visibleSelectedCount === filteredItems.length



  async function loadContent() {
    try {
      setLoading(true)
      const payload = await api.getAdminContent(token)
      setItems(payload.conteudos)
      setSelectedIds((current) => current.filter((id) => payload.conteudos.some((item) => item.id === id)))
    } catch (error) {
      onError(error instanceof Error ? error.message : 'failed to load content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadContent()
  }, [token])

  function toggleSelection(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]))
  }

  function toggleSelectAll() {
    setSelectedIds((current) => {
      const visibleIds = filteredItems.map((item) => item.id)

      if (!visibleIds.length) {
        return current
      }

      const everyVisibleSelected = visibleIds.every((id) => current.includes(id))

      if (everyVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id))
      }

      return Array.from(new Set([...current, ...visibleIds]))
    })
  }


  async function handleDeleteSelected() {
    try {
      setDeleting(true)
      await api.deleteContents(token, selectedIds)
      const deletedCount = selectedIds.length
      setConfirmOpen(false)
      setItems((current) => current.filter((item) => !selectedIds.includes(item.id)))
      setSelectedIds([])
      onSuccess(`${deletedCount} content item(s) deleted.`)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'failed to delete selected content')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <section className="space-y-5 border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
        <div className="border-b border-zinc-800 pb-4">
          <p className="text-[11px] tracking-[0.3em] text-[#ff1e9d]">content manager</p>
          <h2 className="mt-2 text-xl font-black text-white">review and delete saved content</h2>
        </div>

        <div className="flex flex-col gap-3 border border-zinc-800 bg-black p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-xs tracking-[0.08em] text-zinc-400">
            {loading
              ? 'loading content...'
              : `${filteredItems.length} visible item(s) of ${items.length}. ${selectedCount} selected in total.`}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-wrap gap-2">
              {(['all', 'normal'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`min-h-12 border px-4 text-xs font-black tracking-[0.12em] transition ${
                    activeFilter === filter
                      ? 'border-[#00fff7] bg-[#00fff7] text-black'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-white hover:text-white'
                  }`}
                >
                  {filter === 'all' ? 'all content' : 'normal content'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={!filteredItems.length || loading}
              className="min-h-12 border border-white px-4 text-xs font-black tracking-[0.12em] text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {allSelected ? 'clear visible' : 'select visible'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={!selectedCount || deleting}
              className="min-h-12 border border-[#ff1e9d] bg-[#ff1e9d] px-4 text-xs font-black tracking-[0.12em] text-black transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting ? 'deleting...' : 'delete selected'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {loading ? (
            <div className="border border-dashed border-zinc-700 bg-black px-4 py-10 text-center text-xs tracking-[0.12em] text-zinc-500 lg:col-span-2">
              loading saved content...
            </div>
          ) : filteredItems.length ? (
            filteredItems.map((item) => {
              const isImage = item.tipo === 'photo_normal'
              const previewUrl = proxiedMediaUrl(item.url_video)
              const posterUrl = proxiedMediaUrl(item.url_capa)

              return (
                <article key={item.id} className="border border-zinc-800 bg-black p-3">
                  <label className="mb-3 flex cursor-pointer items-center gap-3 border border-zinc-800 px-3 py-3 text-xs font-black tracking-[0.1em] text-white">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="h-4 w-4 accent-[#ff1e9d]"
                    />
                    <span>select for deletion</span>
                  </label>

                  <div className="border border-zinc-800 bg-zinc-950 p-2">
                    {isImage ? (
                      <img src={previewUrl} alt={item.descricao || 'saved content'} className="aspect-[9/16] w-full object-cover" />
                    ) : (
                      <video
                        src={previewUrl}
                        poster={posterUrl}
                        controls
                        preload="metadata"
                        className="aspect-[9/16] w-full bg-black object-cover"
                      />
                    )}
                  </div>

                  <div className="mt-4 space-y-2 text-xs tracking-[0.08em] text-zinc-400">
                    <p className="font-black text-[#00fff7]">{typeLabel(item)}</p>
                    <p>{item.descricao || 'no description'}</p>
                    <p>id: {item.id}</p>
                    <p>created: {new Date(item.criado_em).toLocaleString()}</p>
                    <p>views: {item.visualizacoes} / likes: {item.likes}</p>
                  </div>
                </article>
              )
            })
          ) : (
            <div className="border border-dashed border-zinc-700 bg-black px-4 py-10 text-center text-xs tracking-[0.12em] text-zinc-500 lg:col-span-2">
              no saved content found.
            </div>
          )}
        </div>
      </section>

      <ConfirmModal
        open={confirmOpen}
        title="delete selected content?"
        description={`${selectedCount} selected item(s) will be permanently removed from the database.`}
        confirmLabel="delete now"
        tone="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDeleteSelected}
      />
    </>
  )
}
