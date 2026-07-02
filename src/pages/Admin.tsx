import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import type { Category } from '../../shared/types'
import CategoryManager from '@/components/CategoryManager'
import ContentManager from '@/components/ContentManager'

import VideoIngestionPanel from '@/components/VideoIngestionPanel'
import { useAuthStore } from '@/store/useAuthStore'
import { api } from '@/utils/api'

type AdminTab = 'categorias' | 'ingestao' | 'conteudos'

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: 'categorias', label: 'categories' },
  { id: 'ingestao', label: 'fetch content' },
  { id: 'conteudos', label: 'manage content' },
]

export default function Admin() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const [activeTab, setActiveTab] = useState<AdminTab>('categorias')
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('panel ready.')

  useEffect(() => {
    if (!token) {
      return
    }

    api
      .getCategories(token)
      .then((payload) => {
        setCategories(payload.categorias)
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : 'failed to load categories.')
      })
  }, [token])

  if (!token || !user) {
    return null
  }

  async function refreshCategories() {
    const payload = await api.getCategories(token)
    setCategories(payload.categorias)
  }

  async function handleCreateCategory() {
    try {
      setBusy(true)
      await api.createCategory(token, newCategory)
      setNewCategory('')
      await refreshCategories()
      setStatus('category created.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'failed to create category.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      setBusy(true)
      await api.deleteCategory(token, id)
      await refreshCategories()
      setStatus('category deleted.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'failed to delete category.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="border border-zinc-800 bg-zinc-950 p-5 sm:p-8">
        <div className="flex flex-col gap-5 border-b border-zinc-800 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] tracking-[0.34em] text-[#ff1e9d]">admin panel</p>
            <h1 className="mt-3 text-4xl font-black leading-none text-white">splashwet /admin</h1>
            <p className="mt-3 text-sm tracking-[0.04em] text-zinc-500">
              active session for {user.username}. there is no public menu link.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex min-h-12 items-center justify-center gap-2 border border-white px-4 text-xs font-black tracking-[0.12em] text-white transition hover:border-[#00fff7] hover:bg-[#00fff7] hover:text-black"
          >
            <LogOut size={16} />
            sign out
          </button>
        </div>

        <div className="mt-5 border border-zinc-800 bg-black p-3 text-[11px] tracking-[0.08em] text-zinc-400">
          {status}
        </div>

        <nav className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-12 border px-4 text-xs font-black tracking-[0.12em] transition ${
                activeTab === tab.id
                  ? 'border-[#00fff7] bg-[#00fff7] text-black'
                  : 'border-zinc-800 bg-black text-zinc-400 hover:border-white hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </section>

      <section className="mt-6">
        {activeTab === 'categorias' ? (
          <CategoryManager
            categories={categories}
            value={newCategory}
            busy={busy}
            onChange={setNewCategory}
            onCreate={handleCreateCategory}
            onDelete={handleDeleteCategory}
          />
        ) : null}

        {activeTab === 'ingestao' ? (
          <VideoIngestionPanel
            token={token}
            categories={categories}
            onSuccess={setStatus}
            onError={setStatus}
          />
        ) : null}



        {activeTab === 'conteudos' ? (
          <ContentManager token={token} onSuccess={setStatus} onError={setStatus} />
        ) : null}
      </section>
    </main>
  )
}
