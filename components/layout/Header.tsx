'use client';

import { LogOut, User, Search, KeyRound, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
    <>
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
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 text-sm font-semibold transition-colors p-2 text-[var(--text-secondary)] hover:text-emerald-500"
              title="Change Password"
            >
              <KeyRound className="w-4 h-4" />
              <span className="hidden sm:inline">Password</span>
            </button>
            <div className="w-px h-5 bg-[var(--border)]" />
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

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password changed successfully!');
        onClose();
      } else {
        toast.error(data.error || 'Failed to change password');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal max-w-md">
        <div className="modal-header">
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-500" /> Change Password
          </h2>
          <button onClick={onClose} className="transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="input pr-10"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  className="input pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter new password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-rose-500 text-xs mt-1 font-medium">Passwords do not match</p>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !currentPassword || !newPassword || newPassword !== confirmPassword}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
