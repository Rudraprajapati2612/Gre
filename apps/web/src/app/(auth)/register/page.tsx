'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-detect timezone
  const timezone = typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'Asia/Kolkata'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await register(email, password, displayName || undefined, timezone)
      router.replace('/today')
    } catch (err: any) {
      setError(err?.error?.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-surface border border-border rounded-[20px] shadow-sm p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-[28px] text-ink">Create your account</h1>
          <p className="text-ink-soft text-sm">Start your GRE prep today — it&apos;s free.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-ink-soft block">
              Display name <span className="text-ink-soft/50">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-surface-muted border border-border rounded-[10px] px-4 py-2.5 text-base text-ink placeholder:text-ink-soft/50 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
            />
          </div>

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
              Password <span className="text-ink-soft/50">(min. 8 chars)</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
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

          <p className="text-xs text-ink-soft">
            Timezone detected: <span className="text-ink font-medium">{timezone}</span>
          </p>

          {error && (
            <p className="text-danger text-sm bg-danger-wash rounded-[8px] px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 bg-brand text-white font-medium rounded-[10px] hover:bg-brand-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-ink-soft">
          Already have an account?{' '}
          <Link href="/login" className="text-brand hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
