import { useState } from 'react'
import { EyeOff, Save } from 'lucide-react'
import type { AlbumMediaItem, Category } from '../../shared/types'
import CategoryChecklist from '@/components/CategoryChecklist'
import ConfirmModal from '@/components/ConfirmModal'
import { originalMediaUrl, proxiedMediaUrl } from '@/utils/media'

type MediaReviewCardProps = {
  index: number
  item: AlbumMediaItem
  selected: boolean
  categories: Category[]
  selectedIds: string[]
  description: string
  busy: boolean
  canSave: boolean
  onToggleSelect: () => void
  onDescriptionChange: (value: string) => void
  onToggleCategory: (id: string) => void
  onIgnore: () => void
  onSave: () => void
}

export default function MediaReviewCard({
  index,
  item,
  selected,
  categories,
  selectedIds,
  description,
  busy,
  canSave,
  onToggleSelect,
  onDescriptionChange,
  onToggleCategory,
  onIgnore,
  onSave,
}: MediaReviewCardProps) {
  const [confirmIgnoreOpen, setConfirmIgnoreOpen] = useState(false)
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false)
  const mediaUrl = proxiedMediaUrl(item.sourceUrl)
  const posterUrl = proxiedMediaUrl(item.coverUrl)
  // Fallback URLs used if the proxy request fails in production
  const fallbackMediaUrl = originalMediaUrl(item.sourceUrl)
  const fallbackPosterUrl = originalMediaUrl(item.coverUrl)

  return (
    <>
      <article className="border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <p className="text-[11px] tracking-[0.3em] text-[#00fff7]">media {index + 1}</p>
            <h3 className="mt-2 text-lg font-black text-white">
              {item.mediaType === 'photo' ? 'still item' : 'media ready for review'}
            </h3>
          </div>

          <div className="flex items-start gap-3">
            <label className="flex cursor-pointer items-center gap-2 border border-zinc-700 px-3 py-2 text-[11px] font-bold tracking-[0.12em] text-white">
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggleSelect}
                className="h-4 w-4 accent-[#ff1e9d]"
              />
              select
            </label>

            <div className="border border-zinc-700 px-3 py-2 text-[11px] font-bold tracking-[0.12em] text-zinc-400">
              {item.width || '?'} x {item.height || '?'}
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,360px),1fr]">
          <div className="border border-zinc-800 bg-black p-2">
            {item.mediaType === 'photo' ? (
              <img
                src={mediaUrl}
                alt={`preview ${index + 1}`}
                className="h-[420px] w-full object-cover"
                onError={(e) => {
                  if (fallbackMediaUrl && e.currentTarget.src !== fallbackMediaUrl) {
                    e.currentTarget.src = fallbackMediaUrl
                  }
                }}
              />
            ) : (
              <video
                src={mediaUrl}
                poster={posterUrl}
                controls
                preload="metadata"
                className="h-[420px] w-full bg-black object-cover"
                onError={(e) => {
                  if (fallbackMediaUrl && e.currentTarget.src !== fallbackMediaUrl) {
                    e.currentTarget.src = fallbackMediaUrl
                  }
                }}
                onLoadStart={(e) => {
                  if (fallbackPosterUrl && !e.currentTarget.poster) {
                    e.currentTarget.poster = fallbackPosterUrl
                  }
                }}
              />
            )}
          </div>

          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-[11px] font-bold tracking-[0.28em] text-zinc-500">add description</p>
              <textarea
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                rows={4}
                placeholder="optional description"
                className="min-h-[120px] w-full border border-zinc-700 bg-black px-4 py-4 text-sm tracking-[0.04em] text-white outline-none transition placeholder:text-zinc-600 focus:border-[#ff1e9d]"
              />
            </div>

            <CategoryChecklist
              categories={categories}
              selectedIds={selectedIds}
              onToggle={onToggleCategory}
              required
            />

            <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4 sm:flex-row">
              <button
                type="button"
                onClick={() => setConfirmIgnoreOpen(true)}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 border border-white px-4 text-xs font-black tracking-[0.12em] text-white transition hover:border-[#ff1e9d] hover:bg-[#ff1e9d] hover:text-black"
              >
                <EyeOff size={16} />
                ignore item
              </button>
              <button
                type="button"
                onClick={() => setConfirmSaveOpen(true)}
                disabled={busy || !canSave}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 border border-[#00fff7] bg-[#00fff7] px-4 text-xs font-black tracking-[0.12em] text-black transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save size={16} />
                save
              </button>
            </div>

            <div className="border border-dashed border-zinc-700 bg-black px-4 py-3 text-[11px] tracking-[0.08em] text-zinc-500">
              final url: {item.sourceUrl}
            </div>
          </div>
        </div>
      </article>

      <ConfirmModal
        open={confirmIgnoreOpen}
        title="ignore this item?"
        description="this item will be removed only from the current ingestion list."
        confirmLabel="ignore"
        tone="danger"
        onCancel={() => setConfirmIgnoreOpen(false)}
        onConfirm={() => {
          setConfirmIgnoreOpen(false)
          onIgnore()
        }}
      />

      <ConfirmModal
        open={confirmSaveOpen}
        title="save as standard media?"
        description="the processed final url and dimensions will be stored in supabase."
        confirmLabel="save now"
        onCancel={() => setConfirmSaveOpen(false)}
        onConfirm={() => {
          setConfirmSaveOpen(false)
          onSave()
        }}
      />
    </>
  )
}
