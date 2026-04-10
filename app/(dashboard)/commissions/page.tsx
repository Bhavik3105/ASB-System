'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/tables/DataTable';
import { TrendingUp, Calendar, Plus, ArrowDownCircle, ArrowUpCircle, Settings, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import TransactionModal from '@/components/forms/TransactionModal';
import DailyBreakdownModal from '@/components/forms/DailyBreakdownModal';

export default function CommissionsPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const fetchDailyCommissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/commissions/daily?${params}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast.error('Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyCommissions();
  }, [filters]);

  const openBreakdown = (date: string) => {
    setSelectedDate(date);
    setIsBreakdownOpen(true);
  };

  const handleDeleteDay = async (date: string) => {
    if (!confirm(`Are you sure you want to delete ALL transactions for ${formatDate(date)}? This cannot be undone.`)) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/commissions/bulk-delete?date=${date}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success(`Deleted ${json.deletedCount} entries for ${formatDate(date)}`);
        fetchDailyCommissions();
        router.refresh();
      } else {
        toast.error(json.error || 'Failed to delete data');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Date', accessor: (row: any) => formatDate(row.date) },
    { 
      header: 'Deposit Total', 
      accessor: (row: any) => (
        <span className="font-bold text-emerald-500">
          {formatCurrency(row.deposits || 0)}
        </span>
      ) 
    },
    { 
      header: 'Dep. Commission', 
      accessor: (row: any) => (
        <span className="text-emerald-400 font-medium text-xs">
          {formatCurrency(row.depositCommission || 0)}
        </span>
      ) 
    },
    { 
      header: 'Withdrawal Total', 
      accessor: (row: any) => (
        <span className="font-bold text-rose-500">
          {formatCurrency(row.withdrawals || 0)}
        </span>
      ) 
    },
    { 
      header: 'Wid. Commission', 
      accessor: (row: any) => (
        <span className="text-rose-400 font-medium text-xs">
          {formatCurrency(row.withdrawalCommission || 0)}
        </span>
      ) 
    },
    { 
      header: 'Daily Total', 
      accessor: (row: any) => (
        <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl font-black border border-emerald-500/20 text-center shadow-sm">
          {formatCurrency(row.totalDailyCommission || 0)}
        </div>
      )
    },
    { 
      header: 'Actions', 
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => openBreakdown(row.date)} 
            className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors bg-slate-800/50 rounded-lg group"
          >
            <Settings className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
            Manage
          </button>
          
          <button 
            onClick={() => handleDeleteDay(row.date)} 
            className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-500/20"
            title="Delete Entire Day's Transactions"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    },
  ];

  const totalDeposits = data.reduce((sum, row: any) => sum + (row.deposits || 0), 0);
  const totalWithdrawals = data.reduce((sum, row: any) => sum + (row.withdrawals || 0), 0);
  const totalCommission = data.reduce((sum, row: any) => sum + (row.totalDailyCommission || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Daily Commissions</h1>
            <p className="text-[var(--text-secondary)] font-medium mt-0.5">Aggregated report of daily earnings and management ledger.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] shadow-sm p-1.5 gap-1">
            <div className="flex items-center gap-2 px-3 py-1.5 border-r border-[var(--border)]">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                className="bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none cursor-pointer"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5">
              <input 
                type="date" 
                className="bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none cursor-pointer"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4" /> Add Commission
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
            Total Deposits
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{formatCurrency(totalDeposits)}</h2>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <ArrowUpCircle className="w-4 h-4" />
            </div>
            Total Withdrawals
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{formatCurrency(totalWithdrawals)}</h2>
        </div>

        <div className="stat-card border-b-4 border-b-emerald-500">
          <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
            Total Commission Earned
          </div>
          <h2 className="text-2xl font-bold text-emerald-500 tracking-tight">{formatCurrency(totalCommission)}</h2>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        loading={loading} 
      />

      {/* Main Add Modal - Dual Entry Mode */}
      <TransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => {
          fetchDailyCommissions();
          router.refresh();
        }} 
        hideBankClient={true}
        dualEntry={true}
      />

      {/* Breakdown Management Modal */}
      <DailyBreakdownModal
        isOpen={isBreakdownOpen}
        onClose={() => setIsBreakdownOpen(false)}
        date={selectedDate}
        onSuccess={() => {
          fetchDailyCommissions();
          router.refresh();
        }}
      />
    </div>
  );
}
