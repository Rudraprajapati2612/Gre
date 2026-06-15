'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import {
  Mountain,
  LayoutDashboard,
  Layers,
  BookOpen,
  PenTool,
  LayoutTemplate,
  LogOut,
  Menu,
  X,
  Calculator,
} from 'lucide-react';
import { Button } from '../ui/button';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF7F2]">
        <div className="h-8 w-8 rounded-full border-4 border-[#E8743B]/30 border-t-[#E8743B] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: 'Mountain', href: '/mountain', icon: <Mountain className="h-5 w-5" /> },
    { label: 'Quant', href: '/quant', icon: <Calculator className="h-5 w-5" /> },
    { label: 'Review', href: '/review', icon: <Layers className="h-5 w-5" /> },
    { label: 'Practice', href: '/practice', icon: <PenTool className="h-5 w-5" /> },
    { label: 'Words', href: '/words', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Analytics', href: '/analytics', icon: <LayoutTemplate className="h-5 w-5" /> },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-[#FAF7F2] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#D6CFC4]/50 bg-white/50 backdrop-blur-sm z-10 transition-all">
        <div className="p-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[#E8743B] hover:-translate-y-0.5 transition-transform"
          >
            <Mountain className="h-8 w-8" />
            <span className="font-serif italic font-bold text-3xl text-[#1F2430]">Summit</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#1F2430] text-white shadow-lg shadow-[#1F2430]/10 font-bold'
                    : 'text-[#1F2430]/70 hover:bg-[#1F2430]/5 hover:text-[#1F2430]'
                }`}
              >
                {item.icon}
                <span className={isActive ? 'font-serif italic' : ''}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#D6CFC4]/50">
          <div className="flex items-center gap-3 px-4 py-3 text-sm text-[#1F2430]/70">
            <div className="h-8 w-8 rounded-full bg-[#EBE5DA] flex items-center justify-center font-medium text-[#1F2430]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate">{user.name}</span>
            <button onClick={handleLogout} className="p-1 hover:text-[#E8743B]" title="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full h-16 border-b border-[#D6CFC4]/30 bg-[#FAF7F2]/90 backdrop-blur-md z-40 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-[#E8743B]">
          <Mountain className="h-6 w-6" />
          <span className="font-serif font-bold text-lg text-[#1F2430]">Summit</span>
        </Link>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-[#1F2430]">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#FAF7F2] flex flex-col">
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#D6CFC4]/30">
            <span className="font-serif font-bold text-lg text-[#1F2430]">Menu</span>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-[#1F2430]">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-[#E8743B] text-white shadow-sm font-medium'
                      : 'text-[#1F2430]/70 hover:bg-[#EBE5DA] hover:text-[#1F2430]'
                  }`}
                >
                  {item.icon}
                  <span className="text-lg">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-6 border-t border-[#D6CFC4]/50 flex items-center justify-between">
            <span className="text-lg truncate">{user.name}</span>
            <Button variant="ghost" onClick={handleLogout} className="gap-2">
              Log out <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full pt-16 md:pt-0 pb-20 md:pb-0 relative">
        <div className="max-w-5xl mx-auto p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 w-full h-16 border-t border-[#D6CFC4]/50 bg-[#FAF7F2]/90 backdrop-blur-md z-40 flex items-center justify-around px-2">
        {[navItems[0], navItems[1], navItems[2], navItems[4]].map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-[#E8743B]' : 'text-[#1F2430]/50 hover:text-[#1F2430]'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
