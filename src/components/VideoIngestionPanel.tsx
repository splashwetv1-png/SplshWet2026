import { useState } from 'react'
import type { AlbumMediaItem, Category } from '../../shared/types'
import { api } from '@/utils/api'
import ConfirmModal from '@/components/ConfirmModal'
import MediaReviewCard from '@/components/MediaReviewCard'

type DraftState = {
  description: string
  selectedIds: string[]
}

type VideoIngestionPanelProps = {
  token: string
  categories: Category[]
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export default function VideoIngestionPanel({
  token,
  categories,
  onSuccess,
  onError,
}: VideoIngestionPanelProps) {
  const [albumUrl, setAlbumUrl] = useState('')
  const [items, setItems] = useState<AlbumMediaItem[]>([])
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({})
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [confirmSaveAllOpen, setConfirmSaveAllOpen] = useState(false)
  const [confirmSaveSelectedOpen, setConfirmSaveSelectedOpen] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])

  function getItemKey(item: AlbumMediaItem) {
    return item.providerId || item.sourceUrl
  }

  function ensureDraft(id: string) {
    return drafts[id] || { description: '', selectedIds: [] }
  }

  function updateDraft(id: string, updater: (draft: DraftState) => DraftState) {
    setDrafts((current) => ({
      ...current,
      [id]: updater(current[id] || { description: '', selectedIds: [] }),
    }))
  }

  async function handleFetchAlbum() {
    try {
      setLoading(true)
      const response = await api.fetchAlbum(token, albumUrl)
      setItems(response.items)
      setDrafts({})
      setSelectedItemIds([])
      onSuccess(`${response.items.length} media items loaded for review.`)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'failed to fetch album')
    } finally {
      setLoading(false)
    }
  }

  async function saveItem(item: AlbumMediaItem) {
    const draft = ensureDraft(item.providerId || item.sourceUrl)

    await api.saveVideoNormal(token, {
      descricao: draft.description || null,
      urlVideo: item.sourceUrl,
      urlCapa: item.coverUrl,
      mediaType: item.mediaType,
      categoriasIds: draft.selectedIds,
      coordenadas: {
        width: item.width,
        height: item.height,
      },
    })
  }

  function toggleItemSelection(item: AlbumMediaItem) {
    const itemKey = getItemKey(item)
    setSelectedItemIds((current) =>
      current.includes(itemKey) ? current.filter((entry) => entry !== itemKey) : [...current, itemKey],
    )
  }

  function toggleSelectAllItems() {
    const itemKeys = items.map((item) => getItemKey(item))
    setSelectedItemIds((current) => (current.length === itemKeys.length ? [] : itemKeys))
  }

  function removeItemFromList(item: AlbumMediaItem) {
    const itemKey = getItemKey(item)
    setItems((current) => current.filter((entry) => entry.sourceUrl !== item.sourceUrl))
    setSelectedItemIds((current) => current.filter((entry) => entry !== itemKey))
  }

  function itemHasCategories(item: AlbumMediaItem) {
    return ensureDraft(getItemKey(item)).selectedIds.length > 0
  }

  async function handleSave(item: AlbumMediaItem) {
    if (bulkSaving) {
      return
    }

    if (!itemHasCategories(item)) {
      onError('select at least one category before saving this item')
      return
    }

    try {
      setSavingId(getItemKey(item))
      await saveItem(item)
      removeItemFromList(item)
      onSuccess('item saved as standard media.')
    } catch (error) {
      onError(error instanceof Error ? error.message : 'failed to save item')
    } finally {
      setSavingId(null)
    }
  }

  async function handleSaveAll() {
    await handleSaveMany(items)
  }

  async function handleSaveSelected() {
    await handleSaveMany(items.filter((item) => selectedItemIds.includes(getItemKey(item))))
  }

  async function handleSaveMany(itemsToSave: AlbumMediaItem[]) {
    const uncategorizedItems = itemsToSave.filter((item) => !itemHasCategories(item))

    if (uncategorizedItems.length) {
      onError(`${uncategorizedItems.length} item(s) still need at least one category before saving.`)
      return
    }

    const failedIds = new Set<string>()
    let savedCount = 0

    try {
      setBulkSaving(true)
      setConfirmSaveAllOpen(false)
      setConfirmSaveSelectedOpen(false)

      for (const item of itemsToSave) {
        const draftKey = getItemKey(item)
        setSavingId(draftKey)

        try {
          await saveItem(item)
          savedCount += 1
        } catch {
          failedIds.add(item.sourceUrl)
        }
      }

      const savedItems = itemsToSave.filter((item) => !failedIds.has(item.sourceUrl))
      const savedItemKeys = new Set(savedItems.map((item) => getItemKey(item)))

      setItems((current) => current.filter((item) => !savedItemKeys.has(getItemKey(item))))
      setSelectedItemIds((current) => current.filter((itemId) => !savedItemKeys.has(itemId)))

      if (savedCount && failedIds.size) {
        onError(`${savedCount} item(s) saved. ${failedIds.size} item(s) failed and stayed in the list.`)
        return
      }

      if (savedCount) {
        onSuccess(`${savedCount} item(s) saved as standard media.`)
        return
      }

      onError('failed to save all items')
    } finally {
      setSavingId(null)
      setBulkSaving(false)
    }
  }

  return (
    <>
      <section className="space-y-5 border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
        <div className="border-b border-zinc-800 pb-4">
          <p className="text-[11px] tracking-[0.3em] text-[#ff1e9d]">album scraping and ingestion</p>
          <h2 className="mt-2 text-xl font-black text-white">single-item review</h2>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            value={albumUrl}
            onChange={(event) => setAlbumUrl(event.target.value)}
            placeholder="https://www.erome.com/a/..."
            className="min-h-12 flex-1 border border-zinc-700 bg-black px-4 text-sm tracking-[0.04em] text-white outline-none transition placeholder:text-zinc-600 focus:border-[#00fff7]"
          />
          <button
            type="button"
            onClick={handleFetchAlbum}
            disabled={loading || bulkSaving}
            className="min-h-12 border border-[#00fff7] bg-[#00fff7] px-5 text-xs font-black tracking-[0.12em] text-black transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'loading...' : 'fetch content'}
          </button>
        </div>

        {items.length ? (
          <div className="flex flex-col gap-3 border border-zinc-800 bg-black p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-xs tracking-[0.08em] text-zinc-400">
              {bulkSaving ? `saving items...` : `${items.length} item(s) ready to save.`}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={toggleSelectAllItems}
                disabled={bulkSaving || loading || !items.length}
                className="min-h-12 border border-white px-5 text-xs font-black tracking-[0.12em] text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {selectedItemIds.length === items.length ? 'clear selection' : 'select all'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmSaveSelectedOpen(true)}
                disabled={bulkSaving || loading || !selectedItemIds.length}
                className="min-h-12 border border-[#00fff7] bg-[#00fff7] px-5 text-xs font-black tracking-[0.12em] text-black transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {bulkSaving ? 'saving...' : `save selected (${selectedItemIds.length})`}
              </button>
              <button
                type="button"
                onClick={() => setConfirmSaveAllOpen(true)}
                disabled={bulkSaving || loading || !items.length}
                className="min-h-12 border border-[#ff1e9d] bg-[#ff1e9d] px-5 text-xs font-black tracking-[0.12em] text-black transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {bulkSaving ? 'saving all...' : 'save all configured'}
              </button>
            </div>
          </div>
        ) : null}

        <div className="max-h-[980px] space-y-5 overflow-y-auto pr-1">
          {items.length ? (
            items.map((item, index) => {
              const draftKey = item.providerId || item.sourceUrl
              const draft = ensureDraft(draftKey)

              return (
                <MediaReviewCard
                  key={draftKey}
                  index={index}
                  item={item}
                  selected={selectedItemIds.includes(draftKey)}
                  categories={categories}
                  selectedIds={draft.selectedIds}
                  description={draft.description}
                  busy={bulkSaving || savingId === draftKey}
                  canSave={draft.selectedIds.length > 0}
                  onToggleSelect={() => toggleItemSelection(item)}
                  onDescriptionChange={(value) =>
                    updateDraft(draftKey, (current) => ({ ...current, description: value }))
                  }
                  onToggleCategory={(id) =>
                    updateDraft(draftKey, (current) => ({
                      ...current,
                      selectedIds: current.selectedIds.includes(id)
                        ? current.selectedIds.filter((entry) => entry !== id)
                        : [...current.selectedIds, id],
                    }))
                  }
                  onIgnore={() => removeItemFromList(item)}
                  onSave={() => handleSave(item)}
                />
              )
            })
          ) : (
            <div className="border border-dashed border-zinc-700 bg-black px-4 py-10 text-center text-xs tracking-[0.12em] text-zinc-500">
              paste an album url to start reviewing items.
            </div>
          )}
        </div>
      </section>

      <ConfirmModal
        open={confirmSaveAllOpen}
        title="save all configured items?"
        description={`${items.length} item(s) currently in the list will be saved with their own descriptions and category selections.`}
        confirmLabel="save all"
        onCancel={() => setConfirmSaveAllOpen(false)}
        onConfirm={handleSaveAll}
      />

      <ConfirmModal
        open={confirmSaveSelectedOpen}
        title="save selected configured items?"
        description={`${selectedItemIds.length} selected item(s) will be saved with their own descriptions and category selections.`}
        confirmLabel="save selected"
        onCancel={() => setConfirmSaveSelectedOpen(false)}
        onConfirm={handleSaveSelected}
      />
    </>
  )
}
