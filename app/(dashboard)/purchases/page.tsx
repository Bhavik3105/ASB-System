'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/tables/DataTable';
import { ShoppingCart, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import PurchaseModal from '@/components/forms/PurchaseModal';

export default function PurchasesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/purchases');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPurchases(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase?')) return;
    try {
      const res = await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Purchase deleted');
        fetchPurchases();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const openModal = (purchase?: any) => {
    setEditingPurchase(purchase || null);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Date', accessor: (row: any) => formatDate(row.date) },
    { header: 'Title', accessor: 'title' },
    { header: 'Client', accessor: (row: any) => row.clientId?.personName || '-' },
    { header: 'Total Amt', accessor: (row: any) => formatCurrency(row.totalAmount) },
    { header: 'Paid', accessor: (row: any) => <span className="font-bold text-emerald-600">{formatCurrency(row.paidAmount)}</span> },
    {
      header: 'Pending',
      accessor: (row: any) => {
        const pending = row.totalAmount - row.paidAmount;
        return <span className={pending > 0 ? 'text-orange-600 font-semibold' : 'text-slate-400'}>{formatCurrency(pending)}</span>;
      },
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span className={`badge-${row.status === 'Paid' ? 'success' : row.status === 'Pending' ? 'danger' : 'warning'}`}>
          {row.status}
        </span>
      ),
    },
    { header: 'Actions', accessor: (row: any) => (
       <div className="flex gap-2">
         <button onClick={() => openModal(row)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
           <Pencil className="w-4 h-4" />
         </button>
         <button onClick={() => handleDelete(row._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
           <Trash2 className="w-4 h-4" />
         </button>
       </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Buy/Sell Purchases</h1>
            <p className="text-slate-500 font-medium mt-0.5">Track item sales, partial payments, and pending balances.</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => openModal()}>
          <Plus className="w-4 h-4" /> Add Purchase
        </button>
      </div>
      
      <DataTable columns={columns} data={data} loading={loading} />

      <PurchaseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchPurchases}
        initialData={editingPurchase}
      />
    </div>
  );
}
