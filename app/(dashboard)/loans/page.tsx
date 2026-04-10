'use client';

import { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoanModal from '@/components/forms/LoanModal';
import RepaymentModal from '@/components/forms/RepaymentModal';

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const fetchLoans = async () => {
    try {
      const res = await fetch('/api/loans');
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Loan Management</h1>
          <p className="text-slate-500 mt-1">Track lending, interest, and incoming repayments.</p>
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
          <div className="flex items-center gap-3 text-slate-500 text-sm mb-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 shadow-sm shadow-sky-500/5">
              <Landmark className="w-5 h-5" />
            </div>
            Total Out (Principal)
          </div>
          <div className="text-2xl font-bold text-slate-800">₹{stats.totalPrincipal.toLocaleString()}</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-slate-500 text-sm mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-500/5">
              <TrendingDown className="w-5 h-5" />
            </div>
            Interest Earned
          </div>
          <div className="text-2xl font-bold text-emerald-600">+₹{stats.totalInterest.toLocaleString()}</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-slate-500 text-sm mb-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-500/5">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            Total Recovered
          </div>
          <div className="text-2xl font-bold text-indigo-600">₹{stats.totalRepaid.toLocaleString()}</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-slate-500 text-sm mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm shadow-amber-500/5">
              <Clock className="w-5 h-5" />
            </div>
            Net Outstanding
          </div>
          <div className="text-2xl font-bold text-amber-600">₹{netDue.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card !p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search borrower name..."
            className="input !bg-slate-50/50 pl-10"
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
              <div key={loan._id} className="card-hover !p-0 overflow-hidden group">
                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg tracking-tight">{loan.borrowerName}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(loan.startDate).toLocaleDateString()}
                          <span className="text-slate-300">•</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider">{loan.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className={loan.status === 'Settled' ? 'badge-success' : 'badge-info'}>
                      {loan.status}
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Principal</p>
                      <p className="text-slate-700 font-bold text-lg">₹{loan.principalAmount.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Interest ({loan.interestRate}%)</p>
                      <p className="text-emerald-600 font-bold text-lg">+₹{loan.interestAmount.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Remaining</p>
                      <p className="text-amber-600 font-bold text-lg">₹{remaining.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                         Repayment Progress
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-600">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          loan.status === 'Settled' ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-400 to-sky-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
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
                      className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100 hover:bg-white hover:border-emerald-200 hover:text-emerald-600 transition-all text-xs font-bold"
                    >
                      Edit
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
        onSuccess={fetchLoans}
        loan={selectedLoan}
      />

      <RepaymentModal 
        isOpen={isRepayModalOpen}
        onClose={() => setIsRepayModalOpen(false)}
        onSuccess={fetchLoans}
        loan={selectedLoan}
      />
    </div>
  );
}
