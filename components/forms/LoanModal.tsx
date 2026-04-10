'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loan?: any;
}

export default function LoanModal({ isOpen, onClose, onSuccess, loan }: LoanModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    borrowerName: '',
    principalAmount: '',
    interestRate: '',
    duration: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (loan) {
      setForm({
        borrowerName: loan.borrowerName,
        principalAmount: loan.principalAmount.toString(),
        interestRate: loan.interestRate.toString(),
        duration: loan.duration,
        startDate: new Date(loan.startDate).toISOString().split('T')[0],
        notes: loan.notes || ''
      });
    } else {
      setForm({
        borrowerName: '',
        principalAmount: '',
        interestRate: '',
        duration: '',
        startDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [loan, isOpen]);

  if (!isOpen) return null;

  // Real-time calculation
  const principal = parseFloat(form.principalAmount) || 0;
  const rate = parseFloat(form.interestRate) || 0;
  const interestAmount = (principal * rate) / 100;
  const totalReceivable = principal + interestAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.borrowerName || !form.principalAmount || !form.interestRate) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const url = loan ? `/api/loans/${loan._id}` : '/api/loans';
      const method = loan ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          principalAmount: principal,
          interestRate: rate,
          interestAmount,
          totalReceivable
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(loan ? 'Loan updated' : 'Loan added');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to save loan');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {loan ? 'Edit Loan' : 'Add New Loan'}
          </h2>
          <button onClick={onClose} className="transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
          <div>
            <label className="label">Borrower Name</label>
            <input
              type="text"
              className="input !bg-slate-900/30"
              placeholder="Who are you lending to?"
              value={form.borrowerName}
              onChange={(e) => setForm({ ...form, borrowerName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Principal Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                <input
                  type="number"
                  className="input pl-8 !bg-slate-900/30"
                  placeholder="0.00"
                  value={form.principalAmount}
                  onChange={(e) => setForm({ ...form, principalAmount: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Interest Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  className="input pr-8 !bg-slate-900/30"
                  placeholder="2.5"
                  value={form.interestRate}
                  onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
            </div>
          </div>

          {/* Real-time Calculation Display */}
          <div className="rounded-xl p-4 shadow-sm mt-4 mb-4 bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 text-[var(--accent)]">
              <Calculator className="w-4 h-4" />
              Calculated Breakdown
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Principal:</span>
                <span className="text-[var(--text-primary)]">₹{principal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Interest ({rate}%):</span>
                <span className="text-[var(--accent)]">+ ₹{interestAmount.toLocaleString()}</span>
              </div>
              <div className="pt-2 flex justify-between font-bold border-t border-[var(--border)]">
                <span className="text-[var(--text-primary)]">Total Receivable:</span>
                <span className="text-[var(--text-primary)]">₹{totalReceivable.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Duration</label>
              <input
                type="text"
                className="input !bg-slate-900/30"
                placeholder="e.g. 12 Months"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input !bg-slate-900/30"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Notes (Optional)</label>
            <textarea
              className="input min-h-[80px] py-3 h-auto !bg-slate-900/30"
              placeholder="Add any specific terms or details..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (loan ? 'Update' : 'Add Loan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
