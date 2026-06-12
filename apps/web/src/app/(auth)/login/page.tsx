'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      router.replace('/today')
    } catch (err: any) {
      setError(err?.error?.message ?? 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-surface border border-border rounded-[20px] shadow-sm p-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="font-display text-[28px] text-ink">Welcome back</h1>
          <p className="text-ink-soft text-sm">Sign in to continue your streak.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink-soft block">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-surface-muted border border-border rounded-[10px] px-4 py-2.5 text-base text-ink placeholder:text-ink-soft/50 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-ink-soft block">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-surface-muted border border-border rounded-[10px] px-4 py-2.5 pr-10 text-base text-ink placeholder:text-ink-soft/50 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors p-0.5"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-danger text-sm bg-danger-wash rounded-[8px] px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 bg-brand text-white font-medium rounded-[10px] hover:bg-brand-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="text-center text-sm text-ink-soft">
          No account?{' '}
          <Link href="/register" className="text-brand hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
