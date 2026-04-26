'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/tables/DataTable';
import { IndianRupee, Plus, Receipt, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import ExpenseModal from '@/components/forms/ExpenseModal';
import { useRole } from '@/contexts/RoleContext';

export default function ExpensesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const { isViewer } = useRole();

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/expenses');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Expense deleted');
        fetchExpenses();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const openModal = (expense?: any) => {
    setEditingExpense(expense || null);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Date', accessor: (row: any) => formatDate(row.date) },
    { header: 'Title', accessor: 'title' },
    { header: 'Type', accessor: (row: any) => (
       <span className={row.type === 'Business' ? 'badge-info' : 'badge-warning'}>{row.type}</span>
    )},
    { header: 'Amount', accessor: (row: any) => <span className="font-bold text-slate-200">{formatCurrency(row.amount)}</span> },
    ...(!isViewer ? [{ header: 'Actions', accessor: (row: any) => (
       <div className="flex gap-2">
         <button onClick={() => openModal(row)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
           <Pencil className="w-4 h-4" />
         </button>
         <button onClick={() => handleDelete(row._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
           <Trash2 className="w-4 h-4" />
         </button>
       </div>
    )}] : []),
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
             <Receipt className="w-6 h-6" />
           </div>
           <div>
             <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Expenses</h1>
             <p className="text-slate-500 font-medium mt-0.5">Track and manage your home and business expenses.</p>
           </div>
         </div>
         {!isViewer && (
           <button className="btn-primary" onClick={() => openModal()}>
             <Plus className="w-4 h-4" /> Add Expense
           </button>
         )}
      </div>
      
      <DataTable columns={columns} data={data} loading={loading} />

      <ExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchExpenses}
        initialData={editingExpense}
      />
    </div>
  );
}
