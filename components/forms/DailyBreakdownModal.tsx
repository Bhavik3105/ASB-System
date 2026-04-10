'use client';

import { useState, useEffect } from 'react';
import { X, Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import TransactionModal from './TransactionModal';

interface DailyBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  onSuccess: () => void;
}

export default function DailyBreakdownModal({ isOpen, onClose, date, onSuccess }: DailyBreakdownModalProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  const fetchDayTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/transactions?startDate=${date}&endDate=${date}`);
      const json = await res.json();
      if (json.success) setTransactions(json.data);
    } catch {
      toast.error('Failed to load transactions for this day');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && date) fetchDayTransactions();
  }, [isOpen, date]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Entry deleted');
        fetchDayTransactions();
        onSuccess(); // Update main table total
      } else {
        toast.error(json.error || 'Delete failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const openEdit = (t?: any) => {
    setEditingTransaction(t || { date }); // If t is null, we are adding a new one for this date
    setIsEditModalOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal max-w-2xl">
        <div className="modal-header">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Daily Breakdown</h2>
            <p className="text-xs text-[var(--text-secondary)]">{formatDate(date)}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body p-0">
          <div className="p-4 flex justify-between items-center bg-slate-900/30 border-b border-slate-800">
             <span className="text-sm font-semibold text-slate-300">Transaction Ledger</span>
             <button onClick={() => openEdit()} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
               <Plus className="w-3.5 h-3.5" /> Add New Entry
             </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 italic">No transactions found for this date.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/50 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Commission</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {transactions.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-4">
                        <span className={t.type === 'Deposit' ? 'text-emerald-500 font-bold text-xs' : 'text-rose-500 font-bold text-xs'}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-slate-200 text-sm">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-emerald-400 font-bold text-sm">{formatCurrency(t.commission)}</span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 italic truncate max-w-[120px]">
                        {t.reference || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800/50 rounded-lg">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(t._id)} className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800/50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-ghost">Close Ledger</button>
          <div className="text-xs text-slate-500">Totals are updated automatically on main screen.</div>
        </div>

        <TransactionModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            fetchDayTransactions();
            onSuccess();
          }}
          initialData={editingTransaction?._id ? editingTransaction : null}
          hideBankClient={true}
        />
      </div>
    </div>
  );
}
