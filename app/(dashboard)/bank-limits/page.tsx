'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/tables/DataTable';
import { ShieldCheck, Pencil, Landmark, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import BankModal from '@/components/forms/BankModal';

export default function BankLimitsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);

  const fetchBanks = async (searchTerm = '') => {
    try {
      setLoading(true);
      const q = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const res = await fetch(`/api/banks${q}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast.error('Failed to load banks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanks(search); }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank limit?')) return;
    try {
      const res = await fetch(`/api/banks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Bank limit deleted');
        fetchBanks(search);
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const openModal = (bank?: any) => {
    setEditingBank(bank || null);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Bank Name', accessor: (row: any) => row.clientBankName || row.bankName || '-' },
    { header: 'Holder', accessor: (row: any) => row.clientPersonName || row.accountHolderName || '-' },
    { 
      header: 'Limit', 
      accessor: (row: any) => (
        <span className="font-bold text-sky-400">
          {row.dailyLimit > 0 ? formatCurrency(row.dailyLimit) : 'No Limit Set'}
        </span>
      )
    },
    { 
      header: 'Use Limit', 
      accessor: (row: any) => (
        <span className="font-bold text-rose-500">
          {formatCurrency(row.useLimit || 0)}
        </span>
      )
    },
    { 
      header: 'Daily Limit', 
      accessor: (row: any) => {
        const remaining = Math.max(0, (row.dailyLimit || 0) - (row.useLimit || 0));
        return (
          <span className="font-bold text-emerald-500">
            {formatCurrency(remaining)}
          </span>
        );
      }
    },
    { 
      header: 'Status', 
      accessor: (row: any) => {
        const status = row.qrStatus || 'Active';
        const cls = status === 'Active' ? 'badge-success' : status === 'Freeze' ? 'badge-danger' : 'bg-sky-500/10 text-sky-500 border border-sky-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider';
        return <span className={cls}>{status}</span>;
      }
    },
    { header: 'Actions', accessor: (row: any) => (
       <div className="flex gap-2 items-center">
         <button onClick={() => openModal(row)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all group">
           <Pencil className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> 
           <span>Adjust</span>
         </button>
         <button onClick={() => handleDelete(row._id)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all group">
           <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> 
           <span>Delete</span>
         </button>
       </div>
    )},
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center gap-4">
         <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
           <ShieldCheck className="w-6 h-6" />
         </div>
         <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bank Limits</h1>
           <p className="text-slate-500 font-medium mt-0.5">Monitor and manage operational daily limits for all accounts.</p>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Landmark className="w-4 h-4" />
            </div>
            Monitored Banks
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{data.length}</h3>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onSearch={setSearch}
      />

      <BankModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => fetchBanks(search)}
        initialData={editingBank}
      />
    </div>
  );
}
