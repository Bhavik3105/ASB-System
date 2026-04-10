'use client';

import { LogOut, User, Search } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    if (currentSearch !== search) {
      setSearch(currentSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    // On every keystroke, if we are already on the search page, update the URL
    if (pathname === '/search') {
      const q = val.trim() ? `?q=${encodeURIComponent(val.trim())}` : '';
      router.push(`/search${q}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
    router.push(`/search${q}`);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        toast.success('Logged out');
        router.push('/login');
        router.refresh();
      }
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-40 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
      <div className="flex-1 max-w-xl hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search clients, banks, amounts, dates... (Press /)"
            className="w-full rounded-xl py-2 pl-10 pr-4 text-sm transition-all focus:outline-none bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] hover:border-slate-600 focus:border-[var(--accent)] focus:ring-2 focus:ring-emerald-500/20"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </form>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--accent)]">
            <User className="w-5 h-5" />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-semibold transition-colors p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

