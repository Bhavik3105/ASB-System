'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/tables/DataTable';
import { Landmark, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import BankModal from '@/components/forms/BankModal';

export default function BanksPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);

  const fetchBanks = async (searchTerm = '') => {
    try {
      setLoading(true);
      const q = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const res = await fetch(`/api/banks${q}`, { cache: 'no-store' });
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
    if (!confirm('Are you sure you want to delete this bank?')) return;
    try {
      const res = await fetch(`/api/banks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Bank deleted');
        fetchBanks(search);
        router.refresh();
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
    { header: 'Bank Name', accessor: 'bankName' },
    { header: 'Holder', accessor: 'accountHolderName' },
    { header: 'A/C Number', accessor: (row: any) => <span className="font-mono text-slate-400">{row.accountNumber}</span> },
    { 
      header: 'QR Status', 
      accessor: (row: any) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
          row.qrStatus === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
          row.qrStatus === 'Freeze' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
          'bg-sky-500/10 text-sky-500 border-sky-500/20'
        }`}>
          {row.qrStatus}
        </span>
      ) 
    },
    { 
      header: 'Actions', 
      accessor: (row: any) => (
       <div className="flex gap-2">
         <button onClick={() => openModal(row)} className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all border border-transparent hover:border-emerald-500/20">
           <Pencil className="w-4 h-4" />
         </button>
         <button onClick={() => handleDelete(row._id)} className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-500/20">
           <Trash2 className="w-4 h-4" />
         </button>
       </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm">
             <Landmark className="w-6 h-6" />
           </div>
           <div>
             <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Bank Accounts</h1>
             <p className="text-[var(--text-secondary)] font-medium mt-0.5">Manage payout and collection accounts.</p>
           </div>
         </div>
         <button className="btn-primary" onClick={() => openModal()}>
           <Plus className="w-4 h-4" /> Add Bank
         </button>
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
        onSuccess={() => {
          fetchBanks(search);
          router.refresh();
        }}
        initialData={editingBank}
      />
    </div>
  );
}
