'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/tables/DataTable';
import { Wallet, Plus, Pencil, CheckCircle2, AlertCircle, Banknote, History, ArrowLeftRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import EmployeeModal from '@/components/forms/EmployeeModal';
import SalaryModal from '@/components/forms/SalaryModal';

export default function SalaryPage() {
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
      const res = await fetch(`/api/salaries?month=${month}&year=${year}`);
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

  // Calculations for summary cards
  const totalBase = data.reduce((acc, curr: any) => acc + (curr.baseSalary || 0), 0);
  const totalAdvance = data.reduce((acc, curr: any) => acc + (curr.salaryRecord?.advanceAmount || 0), 0);
  const netDue = totalBase - totalAdvance;

  const columns = [
    { header: 'Employee Name', accessor: 'name' },
    {
      header: 'Base Salary',
      accessor: (row: any) => <span className="font-bold text-slate-700">{formatCurrency(row.baseSalary)}</span>
    },
    {
      header: 'Advance Taken',
      accessor: (row: any) => {
        const adv = row.salaryRecord?.advanceAmount || 0;
        return <span className={adv > 0 ? 'text-rose-500 font-bold' : 'text-slate-400'}>{adv > 0 ? `-${formatCurrency(adv)}` : '-'}</span>;
      }
    },
    {
      header: 'Net to Pay',
      accessor: (row: any) => {
        const net = (row.baseSalary || 0) + (row.salaryRecord?.bonusAmount || 0) - (row.salaryRecord?.advanceAmount || 0);
        return <span className={`font-black text-xl tracking-tight ${net < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{formatCurrency(net)}</span>;
      }
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span className={row.salaryRecord?.isPaid ? 'badge-success' : 'badge-warning'}>
          {row.salaryRecord?.isPaid ? 'Paid' : 'Pending'}
        </span>
      )
    },
    {
      header: 'Actions', accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openSalModal(row)} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
            <Banknote className="w-3 h-3" /> Settle
          </button>
          <button onClick={() => openEmpModal(row)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      )
    },

  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-500/5">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Employee Salary</h1>
            <p className="text-slate-500 font-medium mt-0.5">Manage monthly payroll, advances, and settle payments.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-1.5">
            <select
              className="bg-transparent text-sm font-bold text-slate-600 px-4 py-2 outline-none cursor-pointer hover:text-emerald-600 transition-colors"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1} className="bg-white">
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <div className="w-px h-5 bg-slate-100" />
            <select
              className="bg-transparent text-sm font-bold text-slate-600 px-4 py-2 outline-none cursor-pointer hover:text-emerald-600 transition-colors"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y} className="bg-white">
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
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Banknote className="w-4 h-4" />
            </div>
            Gross Salary
          </div>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(totalBase)}</h3>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            Total Advances
          </div>
          <h3 className="text-2xl font-bold text-rose-600 tracking-tight">{formatCurrency(totalAdvance)}</h3>
        </div>

        <div className="stat-card border-b-4 border-b-emerald-500">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
            Net Payroll Due
          </div>
          <h3 className="text-2xl font-bold text-emerald-600 tracking-tight">{formatCurrency(netDue)}</h3>
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
