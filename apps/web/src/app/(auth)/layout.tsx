import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <nav className="flex-none px-6 py-4 flex items-center">
        <Link href="/" className="font-display text-xl text-ink tracking-tight hover:text-brand transition-colors">
          GRE Verbal
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}
