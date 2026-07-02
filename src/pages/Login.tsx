import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/utils/api'
import { useAuthStore } from '@/store/useAuthStore'

type AuthMode = 'login' | 'register'

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('use username and password only.')
  const [busy, setBusy] = useState(false)

  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setBusy(true)
      const payload =
        mode === 'login' ? await api.login(username, password) : await api.register(username, password)

      setSession(payload.token, payload.user)
      setMessage(mode === 'login' ? 'user session started.' : 'user account created and session started.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
        <p className="text-[11px] tracking-[0.34em] text-[#00fff7]">optional user access</p>
        <h1 className="mt-4 text-4xl font-black leading-none text-white">splashwet user login</h1>
        <p className="mt-3 text-sm tracking-[0.04em] text-zinc-500">{message}</p>

        {token && user?.role === 'user' ? (
          <div className="mt-4 border border-zinc-800 bg-black p-3 text-[11px] tracking-[0.08em] text-zinc-400">
            user session active for {user.username}. browsing public content never requires login.
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 border border-zinc-800">
          {(['login', 'register'] as AuthMode[]).map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setMode(entry)}
              className={`min-h-12 text-xs font-black tracking-[0.12em] transition ${
                mode === entry ? 'bg-[#ff1e9d] text-black' : 'bg-black text-zinc-400 hover:text-white'
              }`}
            >
              {entry === 'login' ? 'login' : 'register'}
            </button>
          ))}
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="min-h-12 w-full border border-zinc-700 bg-black px-4 text-sm tracking-[0.04em] text-white outline-none transition placeholder:text-zinc-600 focus:border-[#00fff7]"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="min-h-12 w-full border border-zinc-700 bg-black px-4 text-sm tracking-[0.04em] text-white outline-none transition placeholder:text-zinc-600 focus:border-[#ff1e9d]"
          />
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full border border-[#00fff7] bg-[#00fff7] px-4 text-xs font-black tracking-[0.12em] text-black transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'processing...' : mode === 'login' ? 'sign in now' : 'create account'}
          </button>
        </form>

        <Link
          to="/admin/login"
          className="mt-4 flex min-h-12 items-center justify-center border border-zinc-800 bg-black px-4 text-xs font-black tracking-[0.12em] text-zinc-400 transition hover:border-white hover:text-white"
        >
          admin access is separate
        </Link>
      </section>
    </main>
  )
}
