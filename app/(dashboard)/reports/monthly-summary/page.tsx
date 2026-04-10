'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Loader2, TrendingUp, IndianRupee, AlertCircle } from 'lucide-react';

export default function MonthlySummaryPrint() {
  const searchParams = useSearchParams();
  const month = searchParams.get('month') || (new Date().getMonth() + 1).toString();
  const year = searchParams.get('year') || new Date().getFullYear().toString();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/dashboard?month=${month}&year=${year}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [month, year]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin" />
    </div>
  );

  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="max-w-4xl mx-auto p-10 bg-white text-slate-900 min-h-screen printable-report">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-10 mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">ASB System</h1>
          <p className="text-sm font-bold text-slate-500 uppercase mt-2">Financial Summary Report</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">{monthName} {year}</p>
          <p className="text-xs text-slate-400 mt-1">Generated on: {formatDate(new Date())}</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-10 mb-16">
        <div className="p-8 bg-slate-50 border-l-4 border-emerald-500">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Total Monthly Commission</p>
          <p className="text-3xl font-black text-slate-900">{formatCurrency(data.totalMonthlyCommission)}</p>
        </div>
        <div className="p-8 bg-slate-50 border-l-4 border-red-500">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Total Monthly Expenses</p>
          <p className="text-3xl font-black text-slate-900">{formatCurrency(data.totalMonthlyExpenses)}</p>
        </div>
      </div>

      {/* Net Profit Section */}
      <div className="bg-slate-900 text-white p-10 rounded-2xl mb-16 flex justify-between items-center">
        <div>
          <p className="text-sm font-bold text-emerald-400 uppercase mb-2 tracking-widest">Net Monthly Profit</p>
          <h2 className="text-5xl font-black">{formatCurrency(data.netMonthlyProfit)}</h2>
        </div>
        <IndianRupee className="w-16 h-16 opacity-20" />
      </div>

      {/* Summary Breakdown */}
      <div className="space-y-6">
        <h3 className="text-xl font-black border-b border-slate-200 pb-4">Expense Breakdown</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-bold text-slate-500 uppercase">
              <th className="py-4">Expense Category</th>
              <th className="py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.expenseBreakdown.map((ex: any, i: number) => (
              <tr key={i}>
                <td className="py-4 font-bold">{ex._id || 'Uncategorized'}</td>
                <td className="py-4 text-right font-mono">{formatCurrency(ex.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900">
              <td className="py-6 font-black text-lg">Total Expenses</td>
              <td className="py-6 text-right font-black text-lg text-red-600">{formatCurrency(data.totalMonthlyExpenses)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-10 border-t border-slate-100 text-center text-xs text-slate-400">
        <p>This is a computer-generated financial snapshot from the ASB System.</p>
        <p className="mt-1">© {new Date().getFullYear()} ASB System. Confidential Data.</p>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .printable-report { p-0 !important; }
          nav, aside, header, button { display: none !important; }
        }
      `}</style>
    </div>
  );
}
