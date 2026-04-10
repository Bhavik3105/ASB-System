'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/tables/DataTable';
import { Wallet, Plus, Pencil, Banknote, ArrowLeftRight, TrendingDown, Trash2, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import EmployeeModal from '@/components/forms/EmployeeModal';
import SalaryModal from '@/components/forms/SalaryModal';

export default function SalaryPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isSalModalOpen, setIsSalModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/salaries?month=${month}&year=${year}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast.error('Failed to load salary data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSalaries(); }, [month, year]);

  const openEmpModal = (emp?: any) => {
    setSelectedEmp(emp || null);
    setIsEmpModalOpen(true);
  };

  const openSalModal = (emp: any) => {
    setSelectedEmp(emp);
    setIsSalModalOpen(true);
  };

  const handleDeleteSalary = async (id: string) => {
    if (!confirm('Are you sure you want to delete this salary record (advance/settlement) for this month?')) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/salaries?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Salary record deleted');
        fetchSalaries();
        router.refresh();
      } else {
        toast.error(json.error || 'Delete failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('CAUTION: This will permanently delete the employee record and all related history. Are you sure?')) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Employee deleted successfully');
        fetchSalaries();
        router.refresh();
      } else {
        toast.error(json.error || 'Failed to delete employee');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Calculations for summary cards
  const totalBase = data.reduce((acc, curr: any) => acc + (curr.baseSalary || 0), 0);
  const totalAdvance = data.reduce((acc, curr: any) => acc + (curr.salaryRecord?.advanceAmount || 0), 0);
  const netDue = totalBase - totalAdvance;

  const columns = [
    { header: 'Employee Name', accessor: (row: any) => <span className="font-bold text-[var(--text-primary)]">{row.name}</span> },
    {
      header: 'Base Salary',
      accessor: (row: any) => <span className="font-bold text-slate-400">{formatCurrency(row.baseSalary)}</span>
    },
    {
      header: 'Joining Date',
      accessor: (row: any) => <span className="text-xs text-slate-500">{row.joiningDate ? formatDate(row.joiningDate) : '-'}</span>
    },
    {
      header: 'Advance Taken',
      accessor: (row: any) => {
        const adv = row.salaryRecord?.advanceAmount || 0;
        return <span className={adv > 0 ? 'text-rose-500 font-bold' : 'text-slate-600'}>{adv > 0 ? `-${formatCurrency(adv)}` : '-'}</span>;
      }
    },
    {
      header: 'Net to Pay',
      accessor: (row: any) => {
        const net = (row.baseSalary || 0) - (row.salaryRecord?.advanceAmount || 0);
        return <span className={`font-black text-xl tracking-tight ${net < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(net)}</span>;
      }
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span className={row.salaryRecord?.isPaid ? 'px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'px-2 py-1 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20'}>
          {row.salaryRecord?.isPaid ? 'Paid' : 'Pending'}
        </span>
      )
    },
    {
      header: 'Actions', accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openSalModal(row)} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
            <Banknote className="w-3 h-3" /> Settle / Advance
          </button>
          
          <button onClick={() => openEmpModal(row)} className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all border border-transparent hover:border-emerald-500/20" title="Edit Employee">
            <Pencil className="w-4 h-4" />
          </button>

          <button onClick={() => handleDeleteEmployee(row._id)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-500/20" title="Delete Employee Entirely">
            <UserMinus className="w-4 h-4" />
          </button>

          {row.salaryRecord?._id && (
            <button 
              onClick={() => handleDeleteSalary(row.salaryRecord._id)} 
              className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-500/20"
              title="Delete Salary Record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    },

  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-500/5">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Employee Salary</h1>
            <p className="text-[var(--text-secondary)] font-medium mt-0.5">Track advances and monthly payouts.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden p-1.5">
            <select
              className="bg-transparent text-sm font-bold text-[var(--text-primary)] px-4 py-2 outline-none cursor-pointer hover:text-emerald-500 transition-colors"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1} className="bg-[var(--bg-secondary)]">
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <div className="w-px h-5 bg-[var(--border)]" />
            <select
              className="bg-transparent text-sm font-bold text-[var(--text-primary)] px-4 py-2 outline-none cursor-pointer hover:text-emerald-500 transition-colors"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y} className="bg-[var(--bg-secondary)]">
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={() => openEmpModal()}>
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-400">
              <Banknote className="w-4 h-4" />
            </div>
            Monthly Base Total
          </div>
          <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{formatCurrency(totalBase)}</h3>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-rose-400 text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <TrendingDown className="w-4 h-4" />
            </div>
            Total Advances Taken
          </div>
          <h3 className="text-2xl font-bold text-rose-500 tracking-tight">{formatCurrency(totalAdvance)}</h3>
        </div>

        <div className="stat-card border-b-4 border-b-emerald-500">
          <div className="flex items-center gap-3 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Wallet className="w-4 h-4" />
            </div>
            Net Payable This Month
          </div>
          <h3 className="text-2xl font-bold text-emerald-500 tracking-tight">{formatCurrency(netDue)}</h3>
        </div>
      </div>


      <DataTable
        columns={columns}
        data={data}
        loading={loading}
      />

      <EmployeeModal
        isOpen={isEmpModalOpen}
        onClose={() => setIsEmpModalOpen(false)}
        onSuccess={fetchSalaries}
        initialData={selectedEmp}
      />

      <SalaryModal
        isOpen={isSalModalOpen}
        onClose={() => setIsSalModalOpen(false)}
        onSuccess={fetchSalaries}
        employeeData={selectedEmp}
        month={month}
        year={year}
      />
    </div>
  );
}
