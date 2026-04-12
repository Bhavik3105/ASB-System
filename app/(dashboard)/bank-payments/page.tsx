'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/tables/DataTable';
import { CreditCard, Plus, Trash2, History, ListFilter, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import BankPaymentModal from '@/components/forms/BankPaymentModal';

export default function BankPaymentsPage() {
  const [ledger, setLedger] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'history'>('summary');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ledgerRes, historyRes] = await Promise.all([
        fetch('/api/bank-payments/ledger'),
        fetch('/api/bank-payments')
      ]);
      
      const ledgerJson = await ledgerRes.json();
      const historyJson = await historyRes.json();
      
      if (ledgerJson.success) setLedger(ledgerJson.data);
      if (historyJson.success) setHistory(historyJson.data);
    } catch (err) {
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (payment: any) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    try {
      const res = await fetch(`/api/bank-payments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Payment record deleted');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const summaryColumns = [
    { header: 'Party Name', accessor: 'referenceName' },
    { header: 'Total Due', accessor: (row: any) => formatCurrency(row.totalDue) },
    { header: 'Total Paid', accessor: (row: any) => formatCurrency(row.totalPaid) },
    { 
      header: 'Balance', 
      accessor: (row: any) => (
        <span className={`font-bold ${row.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          {formatCurrency(row.balance)}
        </span>
      )
    },
    { header: 'Payment Date', accessor: (row: any) => row.lastPaymentDate ? formatDate(row.lastPaymentDate) : '-' },
    { header: 'Payment Mode', accessor: (row: any) => row.lastPaymentMode || '-' },
  ];

  const historyColumns = [
    { header: 'Payment Date', accessor: (row: any) => formatDate(row.date) },
    { header: 'Party Name', accessor: 'referenceName' },
    { header: 'Amount', accessor: (row: any) => formatCurrency(row.amount) },
    { header: 'Payment Mode', accessor: 'paymentMode' },
    { header: 'Note', accessor: (row: any) => row.note || '-' },
    { header: 'Actions', accessor: (row: any) => (
       <div className="flex items-center gap-2">
         <button onClick={() => handleEdit(row)} className="p-1 text-slate-400 hover:text-cyan-400 transition-colors">
           <Pencil className="w-4 h-4" />
         </button>
         <button onClick={() => handleDelete(row._id)} className="p-1 text-slate-400 hover:text-red-400 transition-colors">
           <Trash2 className="w-4 h-4" />
         </button>
       </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
         <div>
           <h1 className="page-title flex items-center gap-2">
             <CreditCard className="w-6 h-6 text-cyan-500" /> Bank Payments
           </h1>
           <p className="page-subtitle">Track settlements and balances with purchase parties.</p>
         </div>
         <button className="btn-primary" onClick={() => {
           setSelectedPayment(null);
           setIsModalOpen(true);
         }}>
           <Plus className="w-4 h-4" /> Add Payment
         </button>
      </div>

      <div className="flex gap-2 p-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'summary' ? 'bg-[var(--accent)] text-white shadow-lg shadow-emerald-500/20' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          <ListFilter className="w-4 h-4" /> Summary Ledger
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-[var(--accent)] text-white shadow-lg shadow-emerald-500/20' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          <History className="w-4 h-4" /> Payment History
        </button>
      </div>
      
      <DataTable
        columns={activeTab === 'summary' ? summaryColumns : historyColumns}
        data={activeTab === 'summary' ? ledger : history}
        loading={loading}
      />

      <BankPaymentModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPayment(null);
        }} 
        onSuccess={fetchData}
        initialData={selectedPayment}
      />
    </div>
  );
}
