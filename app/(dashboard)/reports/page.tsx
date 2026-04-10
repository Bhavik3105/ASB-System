'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  TrendingUp,
  ShoppingCart,
  Wallet,
  Landmark,
  Building2,
  Users,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const years = [2024, 2025, 2026];

interface SectionCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;         // Tailwind bg for icon wrapper
  iconColor: string;     // Tailwind text for icon
  borderColor: string;   // Tailwind border accent
  module: string;        // API module param
  dateScope: 'monthly' | 'all'; // whether month/year applies
}

const sections: SectionCard[] = [
  {
    id: 'commissions',
    title: 'Commissions',
    description: 'All commission transactions for the selected month — client, bank, type, and amount.',
    icon: TrendingUp,
    color: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    module: 'commissions',
    dateScope: 'monthly',
  },
  {
    id: 'expenses',
    title: 'Expenses',
    description: 'Monthly expense records including title, type, amounts, and notes.',
    icon: BarChart3,
    color: 'bg-rose-50',
    iconColor: 'text-rose-600',
    borderColor: 'border-rose-200',
    module: 'expenses',
    dateScope: 'monthly',
  },
  {
    id: 'purchases',
    title: 'Purchases',
    description: 'Purchase orders for selected period — status, paid vs pending, and client linkage.',
    icon: ShoppingCart,
    color: 'bg-orange-50',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    module: 'purchases',
    dateScope: 'monthly',
  },
  {
    id: 'loans',
    title: 'Loans',
    description: 'All loan records — principal, interest rate, repaid amount, and outstanding balance.',
    icon: Landmark,
    color: 'bg-sky-50',
    iconColor: 'text-sky-600',
    borderColor: 'border-sky-200',
    module: 'loans',
    dateScope: 'all',
  },
  {
    id: 'salary',
    title: 'Salary',
    description: 'Employee payroll for the selected month — base salary, advances, bonuses, and net payable.',
    icon: Wallet,
    color: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    borderColor: 'border-indigo-200',
    module: 'salary',
    dateScope: 'monthly',
  },
  {
    id: 'clients',
    title: 'Clients',
    description: 'Full client directory — contact info, bank type, deposit amounts, and open dates.',
    icon: Users,
    color: 'bg-violet-50',
    iconColor: 'text-violet-600',
    borderColor: 'border-violet-200',
    module: 'clients',
    dateScope: 'all',
  },
  {
    id: 'banks',
    title: 'Banks',
    description: 'All bank accounts — account holder, number, mobile, and purchase amounts.',
    icon: Building2,
    color: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    module: 'banks',
    dateScope: 'all',
  },
];

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const buildUrl = (module: string, dateScope: 'monthly' | 'all') => {
    const base = `/api/reports/export/excel?module=${module}`;
    if (dateScope === 'monthly') {
      return `${base}&month=${selectedMonth}&year=${selectedYear}`;
    }
    return base;
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report');
    }
  };

  const handleDownload = (section: SectionCard) => {
    toast.loading(`Preparing ${section.title} report...`, { id: 'download' });
    const url = buildUrl(section.module, section.dateScope);
    
    // Construct local explicit filename (e.g. asb-commissions-April-2026.xlsx)
    const dateStr = section.dateScope === 'monthly' ? `${months[selectedMonth - 1]}-${selectedYear}` : 'All-Time';
    const filename = `asb-${section.module}-${dateStr}.xlsx`;
    
    downloadFile(url, filename).then(() => {
      toast.success(`${section.title} report downloaded!`, { id: 'download' });
    });
  };

  const handleFullExport = () => {
    toast.loading('Preparing full system export...', { id: 'download' });
    const url = buildUrl('all', 'monthly');
    const filename = `asb-full-export-${months[selectedMonth - 1]}-${selectedYear}.xlsx`;
    
    downloadFile(url, filename).then(() => {
      toast.success('Full system export downloaded!', { id: 'download' });
    });
  };

  const handlePDFExport = () => {
    const url = `/reports/monthly-summary?month=${selectedMonth}&year=${selectedYear}`;
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
      setTimeout(() => win.print(), 1000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-[var(--text-primary)]">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--accent)]">
              <FileText className="w-5 h-5" />
            </div>
            Reports & Export
          </h1>
          <p className="font-medium mt-2 text-[var(--text-secondary)]">
            Download individual section reports or the full system export.
          </p>
        </div>

        {/* Month / Year Picker */}
        <div className="flex items-center rounded-2xl shadow-sm p-1.5 gap-0.5 self-start md:self-auto bg-[var(--bg-secondary)] border border-[var(--border)]">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="bg-transparent text-sm font-bold border-none focus:ring-0 cursor-pointer px-4 py-2 transition-colors text-[var(--text-primary)]"
            style={{ backgroundColor: 'transparent' }}
          >
            {months.map((m, i) => (
              <option key={m} value={i + 1} className="bg-[var(--bg-card)]">{m}</option>
            ))}
          </select>
          <div className="w-px h-5 bg-[var(--border)]" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-transparent text-sm font-bold border-none focus:ring-0 cursor-pointer px-4 py-2 transition-colors text-[var(--text-primary)]"
            style={{ backgroundColor: 'transparent' }}
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-[var(--bg-card)]">{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Section Reports Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-[var(--text-secondary)]">
          Section Reports
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className={`card !p-5 flex flex-col gap-4 border-t-4 ${section.borderColor.replace('border-', 'border-t-')} hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 group`}
              >
                {/* Icon + Title */}
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-2xl ${section.color} flex items-center justify-center ${section.iconColor} shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] leading-tight">{section.title}</h3>
                    {section.dateScope === 'monthly' ? (
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                        {months[selectedMonth - 1]} {selectedYear}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                        All Time
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed flex-1">
                  {section.description}
                </p>

                {/* Download Button */}
                <button
                  onClick={() => handleDownload(section)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300
                    ${section.color} ${section.iconColor} border shadow-sm
                    hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Download .xlsx
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Exports */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-[var(--text-secondary)]">
          Full System Export
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Excel Full */}
          <div className="card flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm shrink-0 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--accent)]">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-[var(--text-primary)]">Full System Export</h3>
              <p className="text-sm mt-1 text-[var(--text-secondary)]">
                All modules in one multi-sheet Excel file for{' '}
                <span className="font-semibold text-[var(--accent)]">{months[selectedMonth - 1]} {selectedYear}</span>.
              </p>
            </div>
            <button
              onClick={handleFullExport}
              className="btn-primary shrink-0 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Download .xlsx
            </button>
          </div>

          {/* PDF Snapshot */}
          <div className="card flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-sm shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-[var(--text-primary)]">Monthly Snapshot (PDF)</h3>
              <p className="text-sm mt-1 text-[var(--text-secondary)]">
                Printable PDF summary — commissions, expenses & profit for{' '}
                <span className="font-semibold text-rose-500">{months[selectedMonth - 1]} {selectedYear}</span>.
              </p>
            </div>
            <button
              onClick={handlePDFExport}
              className="btn-danger shrink-0 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Generate PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
