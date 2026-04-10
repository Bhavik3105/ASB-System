'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Landmark, 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  User, 
  MoreVertical,
  ChevronRight,
  TrendingDown,
  Clock,
  Loader2,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoanModal from '@/components/forms/LoanModal';
import RepaymentModal from '@/components/forms/RepaymentModal';

export default function LoansPage() {
  const router = useRouter();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const fetchLoans = async () => {
    try {
      const res = await fetch('/api/loans', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setLoans(data.data);
      }
    } catch (err) {
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const filteredLoans = loans.filter(l => 
    l.borrowerName.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    totalPrincipal: loans.reduce((acc, l) => acc + l.principalAmount, 0),
    totalInterest: loans.reduce((acc, l) => acc + l.interestAmount, 0),
    totalRepaid: loans.reduce((acc, l) => acc + (l.repaidAmount || 0), 0),
    activeCount: loans.filter(l => l.status === 'Active').length
  };

  const totalReceivable = stats.totalPrincipal + stats.totalInterest;
  const netDue = totalReceivable - stats.totalRepaid;

  const handleDeleteLoan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this loan? All linked repayment history will be lost. This cannot be undone.')) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/loans/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Loan deleted permanently');
        fetchLoans();
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to delete loan');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Loan Management</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">Track lending, interest, and incoming repayments.</p>
        </div>
        <button 
          onClick={() => { setSelectedLoan(null); setIsLoanModalOpen(true); }}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Give New Loan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-500 shadow-sm">
              <Landmark className="w-5 h-5" />
            </div>
            Total Out (Principal)
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">₹{stats.totalPrincipal.toLocaleString()}</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm">
              <TrendingDown className="w-5 h-5" />
            </div>
            Interest Earned
          </div>
          <div className="text-2xl font-bold text-emerald-500 tracking-tight">+₹{stats.totalInterest.toLocaleString()}</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-sm">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            Total Recovered
          </div>
          <div className="text-2xl font-bold text-indigo-500 tracking-tight">₹{stats.totalRepaid.toLocaleString()}</div>
        </div>

        <div className="stat-card border-b-4 border-b-amber-500/50">
          <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            Net Outstanding
          </div>
          <div className="text-2xl font-bold text-amber-500 tracking-tight">₹{netDue.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card !p-4 bg-[var(--bg-secondary)] border-[var(--border)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text"
            placeholder="Search borrower name..."
            className="input !bg-slate-900/30 pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Loans Grid/List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full h-40 flex items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="col-span-full h-60 flex flex-col items-center justify-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
            <div className="p-4 bg-slate-50 rounded-2xl mb-4">
              <Landmark className="w-10 h-10 opacity-20" />
            </div>
            <p className="font-medium">No loans found.</p>
          </div>
        ) : (
          filteredLoans.map(loan => {
            const repaid = loan.repaidAmount || 0;
            const progress = (repaid / loan.totalReceivable) * 100;
            const remaining = loan.totalReceivable - repaid;

            return (
              <div key={loan._id} className="card-hover !p-0 overflow-hidden group border-[var(--border)] bg-[var(--bg-secondary)]">
                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-sm group-hover:scale-110 transition-transform">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-[var(--text-primary)] text-xl tracking-tight">{loan.borrowerName}</h3>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(loan.startDate).toLocaleDateString()}
                          <span className="text-slate-700">•</span>
                          <span className="bg-slate-800/50 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider text-slate-400">{loan.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className={loan.status === 'Settled' ? 'px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'px-2 py-1 rounded text-[10px] font-bold uppercase bg-sky-500/10 text-sky-500 border border-sky-500/20'}>
                      {loan.status}
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="space-y-1">
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold">Principal</p>
                      <p className="text-[var(--text-primary)] font-bold text-lg">₹{loan.principalAmount.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold">Interest ({loan.interestRate}%)</p>
                      <p className="text-emerald-500 font-bold text-lg">+₹{loan.interestAmount.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold">Remaining</p>
                      <p className="text-amber-500 font-bold text-lg">₹{remaining.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-2">
                         Repayment Progress
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800/50 rounded-md text-[10px] font-bold text-slate-300">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-slate-900/50 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          loan.status === 'Settled' ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-sky-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button 
                      onClick={() => { setSelectedLoan(loan); setIsRepayModalOpen(true); }}
                      disabled={loan.status === 'Settled'}
                      className="flex-1 btn-primary py-2.5 text-xs justify-center disabled:opacity-30 disabled:grayscale"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      Collect Payment
                    </button>
                    <button 
                      onClick={() => { setSelectedLoan(loan); setIsLoanModalOpen(true); }}
                      className="px-5 py-2.5 bg-slate-800/50 text-slate-300 rounded-2xl border border-slate-700 hover:bg-slate-800 hover:border-emerald-500/50 hover:text-emerald-400 transition-all text-xs font-bold"
                      title="Edit Loan Details"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteLoan(loan._id)}
                      className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all group/del"
                      title="Delete Loan Permanently"
                    >
                      <Trash2 className="w-4 h-4 group-hover/del:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>


      <LoanModal 
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        onSuccess={() => {
          fetchLoans();
          router.refresh();
        }}
        loan={selectedLoan}
      />

      <RepaymentModal 
        isOpen={isRepayModalOpen}
        onClose={() => setIsRepayModalOpen(false)}
        onSuccess={() => {
          fetchLoans();
          router.refresh();
        }}
        loan={selectedLoan}
      />
    </div>
  );
}
