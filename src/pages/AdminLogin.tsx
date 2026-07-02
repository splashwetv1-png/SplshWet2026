import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api } from '@/utils/api'
import { useAuthStore } from '@/store/useAuthStore'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('admin access requires the private credentials.')
  const [busy, setBusy] = useState(false)

  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)

  if (token && user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setBusy(true)
      const payload = await api.adminLogin(username, password)
      setSession(payload.token, payload.user)
      setMessage('admin session started.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'admin authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
        <p className="text-[11px] tracking-[0.34em] text-[#ff1e9d]">private admin access</p>
        <h1 className="mt-4 text-4xl font-black leading-none text-white">splashwet admin</h1>
        <p className="mt-3 text-sm tracking-[0.04em] text-zinc-500">{message}</p>

        {token && user?.role === 'user' ? (
          <div className="mt-4 border border-zinc-800 bg-black p-3 text-[11px] tracking-[0.08em] text-zinc-400">
            a user session is active. admin login will replace it for this browser.
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Admin username"
            className="min-h-12 w-full border border-zinc-700 bg-black px-4 text-sm tracking-[0.04em] text-white outline-none transition placeholder:text-zinc-600 focus:border-[#00fff7]"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Admin password"
            className="min-h-12 w-full border border-zinc-700 bg-black px-4 text-sm tracking-[0.04em] text-white outline-none transition placeholder:text-zinc-600 focus:border-[#ff1e9d]"
          />
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full border border-[#ff1e9d] bg-[#ff1e9d] px-4 text-xs font-black tracking-[0.12em] text-black transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'checking access...' : 'enter admin panel'}
          </button>
        </form>

        <Link
          to="/login"
          className="mt-4 flex min-h-12 items-center justify-center border border-zinc-800 bg-black px-4 text-xs font-black tracking-[0.12em] text-zinc-400 transition hover:border-white hover:text-white"
        >
          go to optional user login
        </Link>
      </section>
    </main>
  )
}
