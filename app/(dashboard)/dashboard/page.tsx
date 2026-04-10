'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import { IndianRupee, TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState({
    totalDailyCommission: 0,
    totalMonthlyCommission: 0,
    totalMonthlyExpenses: 0,
    netMonthlyProfit: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard?month=${selectedMonth}&year=${selectedYear}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch {
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedMonth, selectedYear]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = [2024, 2025, 2026]; // Relevant range for this app

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Dashboard Overview</h1>
          <p className="font-medium text-[var(--text-secondary)]">Welcome back. Monitoring your financial health.</p>
        </div>
        
        <div className="flex items-center gap-2 p-1.5 rounded-2xl shadow-sm bg-[var(--bg-secondary)] border border-[var(--border)]">
           <select 
             value={selectedMonth} 
             onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
             className="bg-transparent text-sm font-bold border-none focus:ring-0 cursor-pointer px-4 py-2 transition-colors text-[var(--text-primary)]"
             style={{ backgroundColor: 'transparent' }}
           >
             {months.map((m, i) => (
               <option key={m} value={i + 1} className="bg-[var(--bg-card)]">{m}</option>
             ))}
           </select>
           <div className="w-px h-5 bg-[var(--border)]" />
           <select 
             value={selectedYear} 
             onChange={(e) => setSelectedYear(parseInt(e.target.value))}
             className="bg-transparent text-sm font-bold border-none focus:ring-0 cursor-pointer px-4 py-2 transition-colors text-[var(--text-primary)]"
             style={{ backgroundColor: 'transparent' }}
           >
             {years.map(y => (
               <option key={y} value={y} className="bg-[var(--bg-card)]">{y}</option>
             ))}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Daily Commission"
          value={data.totalDailyCommission}
          icon={IndianRupee}
          color="cyan"
          loading={loading}
          trend="Today's total"
        />
        <StatsCard
          title="Monthly Commission"
          value={data.totalMonthlyCommission}
          icon={TrendingUp}
          color="emerald"
          loading={loading}
          trend="This month"
        />
        <StatsCard
          title="Monthly Expenses"
          value={data.totalMonthlyExpenses}
          icon={AlertCircle}
          color="red"
          loading={loading}
        />
        <StatsCard
          title="Net Monthly Profit"
          value={data.netMonthlyProfit}
          icon={IndianRupee}
          color="amber"
          loading={loading}
          trend="Commission - Expenses"
        />
      </div>
    </div>
  );
}
