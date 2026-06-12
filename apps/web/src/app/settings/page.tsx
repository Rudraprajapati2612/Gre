'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { LogOut, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.replace('/')
  }

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-sm mx-auto space-y-6">
        <div className="flex items-center gap-3 py-2">
          <Link href="/today" className="p-2 text-ink-soft hover:text-ink hover:bg-surface-muted rounded-full transition-colors">
            <ChevronLeft size={22} />
          </Link>
          <h1 className="font-display text-2xl text-ink">Settings</h1>
        </div>

        {/* Profile card */}
        <div className="bg-surface border border-border rounded-[16px] p-5 space-y-3">
          <h2 className="text-xs font-medium text-ink-soft uppercase tracking-wider">Account</h2>
          <div className="space-y-1">
            {user?.display_name && (
              <p className="font-display text-lg text-ink">{user.display_name}</p>
            )}
            <p className="text-ink-soft text-sm">{user?.email}</p>
            <p className="text-ink-soft text-xs">Timezone: {user?.timezone}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-5 py-3.5 bg-danger-wash text-danger border border-danger/20 rounded-[14px] font-medium hover:bg-danger hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  )
}
