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
    <>
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-serif text-warm-900">Welcome back</h1>
        <p className="text-warm-400 text-sm">Sign in to continue your streak.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-[8px] px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="btn-primary w-full justify-center py-3.5 mt-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          Sign in
        </button>
      </form>

      {/* Bottom link */}
      <p className="text-center text-sm text-warm-400">
        No account?{' '}
        <Link href="/register" className="text-brand-orange font-medium hover:text-brand-orange-dark transition-colors">
          Create one
        </Link>
      </p>
    </>
  )
}
