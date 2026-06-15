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
    <>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-serif text-warm-900">Create your account</h1>
        <p className="text-warm-400 text-sm">Start your GRE prep today — it&apos;s free.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-warm-700 block">
            Display name <span className="text-warm-400 font-normal">(optional)</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="input-premium auth-input"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-warm-700 block">
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
            className="input-premium auth-input"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-warm-700 block">
            Password <span className="text-warm-400 font-normal">(min. 8 chars)</span>
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
              className="input-premium auth-input pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-700 transition-colors"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <p className="text-xs text-warm-400 flex items-center gap-1.5">
          <span aria-hidden="true">📍</span>
          Timezone detected: <span className="text-warm-600 font-medium">{timezone}</span>
        </p>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-[8px] px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="btn-primary w-full justify-center py-3.5 mt-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          Create account
        </button>
      </form>

      <p className="text-center text-sm text-warm-400">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-orange font-medium hover:text-brand-orange-dark transition-colors">
          Sign in
        </Link>
      </p>
    </>
  )
}
