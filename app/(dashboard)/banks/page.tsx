'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/tables/DataTable';
import { Landmark, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import BankModal from '@/components/forms/BankModal';

export default function BanksPage() {
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
    if (!confirm('Are you sure you want to delete this bank?')) return;
    try {
      const res = await fetch(`/api/banks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Bank deleted');
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
    { header: 'Bank Name', accessor: 'bankName' },
    { header: 'Holder', accessor: 'accountHolderName' },
    { header: 'A/C Number', accessor: 'accountNumber' },
    { header: 'Mobile', accessor: 'mobileNumber' },
    { header: 'QR', accessor: (row: any) => <span className={row.qrStatus === 'Done' ? 'badge-success' : 'badge-warning'}>{row.qrStatus}</span> },
    { header: 'KIT', accessor: (row: any) => <span className={row.kitStatus === 'Received' ? 'badge-success' : 'badge-warning'}>{row.kitStatus}</span> },
    { header: 'Email ID', accessor: (row: any) => row.emailId || '-' },
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
           <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
             <Landmark className="w-6 h-6" />
           </div>
           <div>
             <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bank Accounts</h1>
             <p className="text-slate-500 font-medium mt-0.5">Manage payout and collection accounts.</p>
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
        onSuccess={() => fetchBanks(search)}
        initialData={editingBank}
      />
    </div>
  );
}
