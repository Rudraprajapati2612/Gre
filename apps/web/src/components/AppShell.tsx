'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, PenTool, Book, PieChart, Flame, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiProgressSummary } from '@/lib/api'
import { useAuth } from '@/lib/auth'

const NAV_ITEMS = [
  { href: '/today', label: 'Today', icon: Home },
  { href: '/words', label: 'Words', icon: BookOpen },
  { href: '/practice', label: 'Practice', icon: PenTool },
  { href: '/reading', label: 'Reading', icon: Book },
  { href: '/progress', label: 'Progress', icon: PieChart },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const { data: summary } = useQuery({
    queryKey: ['progress-summary'],
    queryFn: apiProgressSummary,
    staleTime: 60_000,
    enabled: !!user,
  })

  const streak = summary?.streakDays ?? 0

  return (
    <div className="flex flex-col h-screen lg:flex-row bg-bg overflow-hidden">
      {/* Sidebar (desktop) / Bottom tab bar (mobile) */}
      <nav className="flex-none lg:w-64 border-t lg:border-t-0 lg:border-r border-border bg-surface z-20
                      fixed bottom-0 w-full lg:relative lg:flex lg:flex-col pb-[env(safe-area-inset-bottom)] lg:pb-0 order-2 lg:order-1 shadow-[0_-4px_16px_rgba(16,32,31,0.04)] lg:shadow-none">

        <div className="hidden lg:flex items-center justify-between px-6 py-6 mb-4">
          <h1 className="font-display text-2xl text-ink tracking-tight">GRE Verbal</h1>
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-amber-wash text-amber px-2 py-1 rounded-full text-xs font-medium">
              <Flame size={12} fill="currentColor" />
              {streak}
            </div>
          )}
        </div>

        <ul className="flex lg:flex-col justify-around lg:justify-start p-2 lg:p-4 gap-1 lg:gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <li key={item.href} className="flex-1 lg:flex-none">
                <Link
                  href={item.href}
                  className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-3 p-2 lg:px-4 lg:py-3 rounded-[12px] transition-all duration-150
                    ${isActive
                      ? 'text-brand bg-brand-wash font-medium'
                      : 'text-ink-soft hover:text-ink hover:bg-surface-muted'
                    }`}
                >
                  <Icon size={22} className={isActive ? 'text-brand' : 'opacity-80'} />
                  <span className="text-[11px] lg:text-[15px]">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Profile / settings (desktop only) */}
        <div className="hidden lg:block mt-auto px-4 py-4 border-t border-border">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors"
          >
            <User size={18} />
            <span className="text-sm truncate">{user?.display_name ?? user?.email ?? 'Settings'}</span>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 order-1 lg:order-2 h-full overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex-none flex items-center justify-between px-4 py-3 lg:hidden bg-surface z-10 sticky top-0 border-b border-border/50">
          <h1 className="font-display text-xl text-ink capitalize">
            {NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label ?? 'GRE Verbal'}
          </h1>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1 text-amber bg-amber-wash px-2.5 py-1 rounded-full">
                <Flame size={14} fill="currentColor" />
                <span className="font-mono font-medium text-sm">{streak}</span>
              </div>
            )}
            <Link href="/settings" className="p-1.5 text-ink-soft hover:text-ink hover:bg-surface-muted rounded-full transition-colors">
              <User size={18} />
            </Link>
          </div>
        </header>

        {/* Top bar (desktop) */}
        <header className="hidden lg:flex flex-none items-center justify-between px-8 py-5 bg-bg/80 backdrop-blur-md sticky top-0 z-10 border-b border-border/50">
          <h1 className="font-display text-2xl text-ink capitalize tracking-tight">
            {NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label ?? 'GRE Verbal'}
          </h1>
          {streak > 0 && (
            <div className="flex items-center gap-2 bg-amber-wash text-amber px-3 py-1.5 rounded-full shadow-sm">
              <Flame size={18} fill="currentColor" />
              <span className="font-mono font-medium text-sm">{streak} day streak</span>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto w-full lg:max-w-[960px] lg:mx-auto relative pb-24 lg:pb-8 p-4 lg:p-8 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  )
}
