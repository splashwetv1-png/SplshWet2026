import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Category } from '../../shared/types'

type CategoryChecklistProps = {
  categories: Category[]
  selectedIds: string[]
  onToggle: (id: string) => void
  required?: boolean
}

export default function CategoryChecklist({
  categories,
  selectedIds,
  onToggle,
  required = false,
}: CategoryChecklistProps) {
  const [open, setOpen] = useState(false)
  const selectedLabels = useMemo(
    () => categories.filter((category) => selectedIds.includes(category.id)).map((category) => category.nome),
    [categories, selectedIds],
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold tracking-[0.28em] text-zinc-500">categories</p>
        <p className={`text-[11px] tracking-[0.08em] ${selectedIds.length ? 'text-[#00fff7]' : 'text-zinc-500'}`}>
          {selectedIds.length ? `${selectedIds.length} selected` : required ? 'required' : 'optional'}
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`flex min-h-12 w-full items-center justify-between gap-4 border px-4 py-3 text-left text-sm transition ${
            selectedIds.length
              ? 'border-[#00fff7] bg-black text-white'
              : 'border-zinc-700 bg-black text-zinc-400 hover:border-white'
          }`}
        >
          <span className="truncate">
            {selectedLabels.length ? selectedLabels.join(', ') : 'select categories'}
          </span>
          <ChevronDown size={18} className={`shrink-0 transition ${open ? 'rotate-180' : ''}`} />
        </button>

        {open ? (
          <div className="max-h-56 space-y-2 overflow-y-auto border border-zinc-800 bg-black p-2">
            {categories.length ? (
              categories.map((category) => {
                const active = selectedIds.includes(category.id)

                return (
                  <label
                    key={category.id}
                    className={`flex cursor-pointer items-center gap-3 border px-3 py-3 text-xs font-bold tracking-[0.08em] transition ${
                      active
                        ? 'border-[#00fff7] bg-[#00fff7] text-black'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => onToggle(category.id)}
                      className="h-4 w-4 accent-[#ff1e9d]"
                    />
                    <span>{category.nome}</span>
                  </label>
                )
              })
            ) : (
              <div className="border border-dashed border-zinc-700 px-4 py-6 text-center text-xs tracking-[0.08em] text-zinc-500">
                no categories available.
              </div>
            )}
          </div>
        ) : null}

        {required && !selectedIds.length ? (
          <p className="text-[11px] tracking-[0.08em] text-[#ff1e9d]">select at least one category before saving.</p>
        ) : null}
      </div>
    </div>
  )
}
