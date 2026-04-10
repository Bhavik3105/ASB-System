'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/tables/DataTable';
import { ArrowLeftRight, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import TransactionModal from '@/components/forms/TransactionModal';

export default function TransactionsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/transactions');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Transaction deleted');
        fetchTransactions();
      } else {
        toast.error(data.error || 'Failed to delete');
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
    { header: 'Type', accessor: (row: any) => (
       <span className={row.type === 'Deposit' ? 'badge-deposit' : 'badge-withdrawal'}>{row.type}</span>
    )},
    { header: 'Client', accessor: (row: any) => row.clientId?.personName || '-' },
    { header: 'Bank', accessor: (row: any) => row.bankId?.bankName || '-' },
    { header: 'Amount', accessor: (row: any) => <span className="font-semibold text-slate-100">{formatCurrency(row.amount)}</span> },
    { header: 'Commission', accessor: (row: any) => <span className="text-emerald-400 font-medium">{formatCurrency(row.commission)}</span> },
    { header: 'Actions', accessor: (row: any) => (
       <div className="flex gap-2">
         <button onClick={() => openModal(row)} className="p-1 text-slate-400 hover:text-cyan-400 transition-colors">
           <Pencil className="w-4 h-4" />
         </button>
         <button onClick={() => handleDelete(row._id)} className="p-1 text-slate-400 hover:text-red-400 transition-colors">
           <Trash2 className="w-4 h-4" />
         </button>
       </div>
    )},
  ];

  return (
    <div>
      <div className="page-header">
         <div>
           <h1 className="page-title flex items-center gap-2"><ArrowLeftRight className="w-6 h-6 text-cyan-500" /> Transactions</h1>
           <p className="page-subtitle">Manage deposits and withdrawals.</p>
         </div>
         <button className="btn-primary" onClick={() => openModal()}>
           <Plus className="w-4 h-4" /> Add Transaction
         </button>
      </div>
      
      <DataTable columns={columns} data={data} loading={loading} />

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchTransactions}
        initialData={editingTransaction}
      />
    </div>
  );
}
