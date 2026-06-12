import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { QueryProvider } from '@/lib/query'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['opsz', 'SOFT', 'WONK'],
})

const mono = IBM_Plex_Mono({
  variable: '--font-mono',
  weight: ['400', '500', '600'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'GRE Verbal',
  description: 'Master GRE vocabulary and verbal reasoning with spaced repetition',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GRE Verbal',
  },
}

export const viewport: Viewport = {
  themeColor: '#0E7C7B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${mono.variable} h-full`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-bg text-ink">
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
