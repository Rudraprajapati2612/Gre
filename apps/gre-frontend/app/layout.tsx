import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/store';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  axes: ['opsz', 'SOFT', 'WONK'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Summit - GRE Prep App',
  description: 'Master GRE vocabulary and questions on the Mountain.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} antialiased selection:bg-[#E8743B] selection:text-white`}>
      <body className="bg-[#FAF7F2] text-[#1F2430] font-sans min-h-screen flex flex-col" suppressHydrationWarning>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
