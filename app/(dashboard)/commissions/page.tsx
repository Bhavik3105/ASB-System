'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/tables/DataTable';
import { TrendingUp, Calendar, Plus, ArrowDownCircle, ArrowUpCircle, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import TransactionModal from '@/components/forms/TransactionModal';

export default function CommissionsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      // Fetching individual transactions (could be filtered by commission > 0 if required)
      const res = await fetch(`/api/transactions?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast.error('Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Record deleted');
        fetchCommissions();
      } else {
        toast.error(json.error || 'Delete failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const openModal = (transaction?: any) => {
    setEditingTransaction(transaction || null);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Date', accessor: (row: any) => formatDate(row.date) },
    { 
      header: 'Deposit', 
      accessor: (row: any) => (
        <span className="font-bold text-emerald-500">
          {row.type === 'Deposit' ? formatCurrency(row.amount) : '-'}
        </span>
      ) 
    },
    { 
      header: 'Deposit Commission', 
      accessor: (row: any) => (
        <span className="text-emerald-400 font-medium">
          {row.type === 'Deposit' ? formatCurrency(row.commission) : '-'}
        </span>
      ) 
    },
    { 
      header: 'Withdrawal', 
      accessor: (row: any) => (
        <span className="font-bold text-rose-500">
          {row.type === 'Withdrawal' ? formatCurrency(row.amount) : '-'}
        </span>
      ) 
    },
    { 
      header: 'Withdrawal Commission', 
      accessor: (row: any) => (
        <span className="text-rose-400 font-medium">
          {row.type === 'Withdrawal' ? formatCurrency(row.commission) : '-'}
        </span>
      ) 
    },
    { 
      header: 'Total Commission', 
      accessor: (row: any) => (
        <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-xl font-black border border-emerald-500/20 text-center shadow-sm">
          {formatCurrency(row.commission)}
        </div>
      )
    },
    { header: 'Reference', accessor: 'reference' },
    { 
      header: 'Actions', 
      accessor: (row: any) => (
        <div className="flex gap-2">
          <button onClick={() => openModal(row)} className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors bg-slate-800/50 rounded-lg">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row._id)} className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors bg-slate-800/50 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  const totalDeposits = data.reduce((sum, row: any) => sum + (row.type === 'Deposit' ? row.amount : 0), 0);
  const totalWithdrawals = data.reduce((sum, row: any) => sum + (row.type === 'Withdrawal' ? row.amount : 0), 0);
  const totalCommission = data.reduce((sum, row: any) => sum + row.commission, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Commissions</h1>
            <p className="text-[var(--text-secondary)] font-medium mt-0.5">Manage daily commission earnings and transaction records.</p>
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

          <button className="btn-primary" onClick={() => openModal()}>
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
            Deposits
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{formatCurrency(totalDeposits)}</h2>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <ArrowUpCircle className="w-4 h-4" />
            </div>
            Withdrawals
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{formatCurrency(totalWithdrawals)}</h2>
        </div>

        <div className="stat-card border-b-4 border-b-emerald-500">
          <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
            Commission Earned
          </div>
          <h2 className="text-2xl font-bold text-emerald-500 tracking-tight">{formatCurrency(totalCommission)}</h2>
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
        initialData={editingTransaction}
        hideBankClient={true}
      />
    </div>
  );
}
