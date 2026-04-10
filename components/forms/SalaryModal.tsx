'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeData: any;
  month: number;
  year: number;
}

export default function SalaryModal({ isOpen, onClose, onSuccess, employeeData, month, year }: SalaryModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    advanceAmount: 0,
    isPaid: false,
    notes: '',
  });

  useEffect(() => {
    if (isOpen && employeeData?.salaryRecord) {
      setForm({
        advanceAmount: employeeData.salaryRecord.advanceAmount || 0,
        isPaid: employeeData.salaryRecord.isPaid || false,
        notes: employeeData.salaryRecord.notes || '',
      });
    }
  }, [isOpen, employeeData]);

  if (!isOpen) return null;

  const baseSalary = employeeData.baseSalary || 0;
  const netPayable = baseSalary - Number(form.advanceAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employeeData._id,
          month,
          year,
          baseSalarySnapshot: baseSalary,
          ...form,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Salary record updated successfully!`);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to update salary');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{employeeData.name}</h2>
            <p className="text-sm font-medium mt-1 text-[var(--text-secondary)]">Salary Processing</p>
          </div>
          <button onClick={onClose} className="transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-6">
            {/* Salary Breakdown Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-bold">Base Salary</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{formatCurrency(baseSalary)}</p>
              </div>
              <div className={`p-4 rounded-xl border ${form.isPaid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-bold">Net Payable</p>
                <p className={`text-xl font-black ${netPayable < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatCurrency(netPayable)}
                </p>
              </div>
            </div>

            <div>
              <label className="label">Monthly Advance (Deduction)</label>
              <div className="relative">
                <input
                  type="number"
                  className="input text-rose-400 focus:border-rose-500/50 pl-10"
                  placeholder="0.00"
                  value={form.advanceAmount}
                  onChange={(e) => setForm({ ...form, advanceAmount: parseFloat(e.target.value) || 0 })}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-bold">-</div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 italic">This amount will be subtracted from the base salary at settlement.</p>
            </div>

            <div>
              <label className="label">Notes / Remarks</label>
              <textarea
                className="input min-h-[80px] resize-none text-sm"
                placeholder="Advance details or payment notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
                checked={form.isPaid}
                onChange={(e) => setForm({ ...form, isPaid: e.target.checked })}
              />
              <span className={`text-sm font-medium transition-colors ${form.isPaid ? 'text-emerald-400' : 'text-slate-300'}`}>
                {form.isPaid ? 'Salary Settled (Paid)' : 'Mark as Fully Paid'}
              </span>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (form.isPaid ? 'Save & Close' : 'Save Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
