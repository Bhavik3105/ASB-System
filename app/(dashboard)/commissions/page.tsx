'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/tables/DataTable';
import { TrendingUp, Calendar, Landmark, Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import TransactionModal from '@/components/forms/TransactionModal';

export default function CommissionsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/commissions/daily?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast.error('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [filters]);

  const columns = [
    { header: 'Date', accessor: (row: any) => formatDate(row.date) },
    { 
      header: 'Deposit', 
      accessor: (row: any) => <span className="font-bold text-emerald-600">{formatCurrency(row.deposits)}</span> 
    },
    { 
      header: 'Deposit Commission', 
      accessor: (row: any) => <span className="text-emerald-500 font-medium">{formatCurrency(row.depositCommission)}</span> 
    },
    { 
      header: 'Withdrawal', 
      accessor: (row: any) => <span className="font-bold text-rose-600">{formatCurrency(row.withdrawals)}</span> 
    },
    { 
      header: 'Withdrawal Commission', 
      accessor: (row: any) => <span className="text-rose-500 font-medium">{formatCurrency(row.withdrawalCommission)}</span> 
    },
    { 
      header: 'Total Daily Commission', 
      accessor: (row: any) => (
        <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl font-black border border-emerald-100 text-center shadow-sm">
          {formatCurrency(row.totalDailyCommission)}
        </div>
      )
    },
  ];

  const totalDeposits = data.reduce((sum, row: any) => sum + row.deposits, 0);
  const totalWithdrawals = data.reduce((sum, row: any) => sum + row.withdrawals, 0);
  const totalCommission = data.reduce((sum, row: any) => sum + row.totalDailyCommission, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Daily Commission</h1>
            <p className="text-slate-500 font-medium mt-0.5">Track daily earnings and transaction volumes per bank account.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Picker */}
          <div className="flex items-center bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 gap-1">
            <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-100">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                className="bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5">
              <input 
                type="date" 
                className="bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" /> Add Commission
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
            Total Deposits
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(totalDeposits)}</h2>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <ArrowUpCircle className="w-4 h-4" />
            </div>
            Total Withdrawals
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(totalWithdrawals)}</h2>
        </div>

        <div className="stat-card border-b-4 border-b-emerald-500">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            Net Commission Earned
          </div>
          <h2 className="text-2xl font-bold text-emerald-600 tracking-tight">{formatCurrency(totalCommission)}</h2>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        loading={loading} 
      />

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchCommissions} 
      />
    </div>
  );
}
