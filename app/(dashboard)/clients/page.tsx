'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DataTable from '@/components/tables/DataTable';
import { Users, Plus, Pencil, Trash2, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import ClientModal from '@/components/forms/ClientModal';
import { useRole } from '@/contexts/RoleContext';

export default function ClientsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { isViewer } = useRole();


  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const fetchClients = async (searchTerm = '') => {
    try {
      setLoading(true);
      const q = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      // Aggressive cache busting with timestamp
      const res = await fetch(`/api/clients?t=${Date.now()}${q}`, { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      const json = await res.json();
      console.log('API Response Debug:', { 
        success: json.success, 
        count: json.data?.length, 
        debug: json._debug,
        timestamp: new Date().toLocaleTimeString()
      });
      if (json.success) {
        setData(json.data);
        setDebugInfo(json._debug);
      }
    } catch (err) {
      console.error('Fetch Clients Error:', err);
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchClients(search); 
  }, [search]);
  
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
    { header: 'Bank Name', accessor: (row: any) => row.bankName || '-' },
    { header: 'Bank Type', accessor: (row: any) => row.bankType || '-' },
    { header: 'Reference', accessor: (row: any) => row.reference || '-' },
    { header: 'Date', accessor: (row: any) => formatDate(row.date) },
    { header: 'Deposit Amt', accessor: (row: any) => formatCurrency(row.depositAmount) },
    { header: 'Buying Price', accessor: (row: any) => formatCurrency(row.buyingPrice || 0) },
    { header: 'Status', accessor: (row: any) => (
       <span className={row.status === 'Frozen' ? 'badge-warning' : 'badge-success'}>
         {row.status || 'Active'}
       </span>
    )},
    ...(!isViewer ? [{ header: 'Actions', accessor: (row: any) => (
       <div className="flex gap-2">
         <button onClick={() => openAppModal(row)} className="p-1 text-slate-400 hover:text-cyan-400 transition-colors">
           <Pencil className="w-4 h-4" />
         </button>
         <button onClick={() => handleDelete(row._id)} className="p-1 text-slate-400 hover:text-red-400 transition-colors">
           <Trash2 className="w-4 h-4" />
         </button>
       </div>
    )}] : []),
  ];

  return (
    <div>
      <div className="page-header">
         <div>
           <h1 className="page-title flex items-center gap-2"><Users className="w-6 h-6 text-cyan-500" /> Bank Purchase</h1>
           <p className="page-subtitle">Bank purchase directory and account information.</p>
         </div>
         {!isViewer && (
           <button className="btn-primary" onClick={() => openAppModal()}>
             <Plus className="w-4 h-4" /> Add Record
           </button>
         )}
      </div>
      
      {debugInfo && Boolean(debugInfo.rawCount > 0 && data.length === 0) && (
         <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-500">
           <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
             <Landmark className="w-5 h-5" />
           </div>
           <div>
             <p className="font-bold text-sm uppercase tracking-wider">Sync Warning</p>
             <p className="text-xs opacity-80">The system found {debugInfo.rawCount} records in the database, but your browser is showing none. This usually means a cache refresh is needed.</p>
           </div>
           <button onClick={() => fetchClients(search)} className="ml-auto text-xs font-bold underline px-4">Force Reload</button>
         </div>
      )}
      
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
