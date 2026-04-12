'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, ArrowLeftRight, Landmark, Users, ShoppingCart, FileText, TrendingUp, CreditCard } from 'lucide-react';
import Image from 'next/image';
import logo from '@/public/logo.jpeg';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Banks', href: '/banks', icon: Landmark },
  { name: 'Bank Limits', href: '/bank-limits', icon: ArrowLeftRight },
  { name: 'Bank Purchase', href: '/clients', icon: Users },
  { name: 'Bank Payment', href: '/bank-payments', icon: CreditCard },
  { name: 'Loans', href: '/loans', icon: Landmark },
  { name: 'Salary', href: '/salary', icon: TrendingUp },
  { name: 'Commissions', href: '/commissions', icon: TrendingUp },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[var(--sidebar-width)] h-screen flex flex-col hidden md:flex fixed left-0 top-0 z-50 bg-[var(--bg-secondary)] border-r border-[var(--border)]">
      <div className="h-20 flex items-center gap-3 px-6 border-b border-[var(--border)]">
        <div className="p-1.5 rounded-2xl shadow-sm bg-[var(--bg-primary)] border border-[var(--border)]">
          <Image 
            src={logo} 
            alt="Logo" 
            width={32}
            height={32}
            className="rounded-xl object-cover" 
          />
        </div>
        <span className="text-xl font-bold text-[var(--text-primary)]">ASB System</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
              <span className="tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6 mt-auto">
        <div className="rounded-2xl p-4 bg-[var(--bg-primary)] border border-[var(--border)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-center text-[var(--text-secondary)]">Version 1.0.0</p>
        </div>
      </div>
    </aside>
  );
}

