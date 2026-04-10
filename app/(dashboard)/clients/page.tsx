'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DataTable from '@/components/tables/DataTable';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import ClientModal from '@/components/forms/ClientModal';

export default function ClientsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const fetchClients = async (searchTerm = '') => {
    try {
      setLoading(true);
      const q = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const res = await fetch(`/api/clients${q}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(search); }, [search]);
  
  // (Leaving the rest of the logic as is...)
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Record deleted');
        fetchClients(search);
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const openAppModal = (client?: any) => {
    setEditingClient(client || null);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Name', accessor: 'personName' },
    { header: 'Mobile', accessor: 'mobileNumber' },
    { header: 'Bank Type', accessor: (row: any) => row.bankType || '-' },
    { header: 'Reference', accessor: (row: any) => row.reference || '-' },
    { header: 'Price', accessor: (row: any) => formatCurrency(row.price) },
    { header: 'Date', accessor: (row: any) => formatDate(row.date) },
    { header: 'Deposit Amt', accessor: (row: any) => formatCurrency(row.depositAmount) },
    { header: 'Status', accessor: (row: any) => (
       <span className={row.isActive ? 'badge-success' : 'badge-danger'}>
         {row.isActive ? 'Active' : 'Inactive'}
       </span>
    )},
    { header: 'Actions', accessor: (row: any) => (
       <div className="flex gap-2">
         <button onClick={() => openAppModal(row)} className="p-1 text-slate-400 hover:text-cyan-400 transition-colors">
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
           <h1 className="page-title flex items-center gap-2"><Users className="w-6 h-6 text-cyan-500" /> Bank Purchase</h1>
           <p className="page-subtitle">Bank purchase directory and account information.</p>
         </div>
         <button className="btn-primary" onClick={() => openAppModal()}>
           <Plus className="w-4 h-4" /> Add Record
         </button>
      </div>
      
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        // Removed local search - now handled globally in the Header
      />

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => fetchClients(search)}
        initialData={editingClient}
      />
    </div>
  );
}
