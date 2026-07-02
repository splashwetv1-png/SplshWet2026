import { Trash2 } from 'lucide-react'
import type { Category } from '../../shared/types'

type CategoryManagerProps = {
  categories: Category[]
  value: string
  busy: boolean
  onChange: (value: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

export default function CategoryManager({
  categories,
  value,
  busy,
  onChange,
  onCreate,
  onDelete,
}: CategoryManagerProps) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-zinc-800 pb-4">
        <p className="text-[11px] tracking-[0.3em] text-[#00fff7]">category management</p>
        <h2 className="text-xl font-black text-white">catalog taxonomy</h2>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="new category"
          className="min-h-12 flex-1 border border-zinc-700 bg-black px-4 text-sm tracking-[0.04em] text-white outline-none transition placeholder:text-zinc-600 focus:border-[#00fff7]"
        />
        <button
          type="button"
          onClick={onCreate}
          disabled={busy}
          className="min-h-12 border border-[#ff1e9d] bg-[#ff1e9d] px-5 text-xs font-black tracking-[0.12em] text-black transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          add
        </button>
      </div>

      <div className="mt-6 grid gap-3">
        {categories.length ? (
          categories.map((category) => (
            <article
              key={category.id}
              className="flex items-center justify-between gap-3 border border-zinc-800 bg-black px-4 py-4"
            >
              <div>
                <p className="text-sm font-black tracking-[0.08em] text-white">{category.nome}</p>
                <p className="mt-1 text-[11px] tracking-[0.08em] text-zinc-500">{category.id}</p>
              </div>

              <button
                type="button"
                onClick={() => onDelete(category.id)}
                className="flex h-11 w-11 items-center justify-center border border-white text-white transition hover:border-[#ff1e9d] hover:bg-[#ff1e9d] hover:text-black"
                aria-label={`delete category ${category.nome}`}
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))
        ) : (
          <div className="border border-dashed border-zinc-700 bg-black px-4 py-8 text-center text-xs tracking-[0.12em] text-zinc-500">
            no categories created yet.
          </div>
        )}
      </div>
    </section>
  )
}
