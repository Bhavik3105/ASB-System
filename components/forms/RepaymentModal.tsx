'use client';

import { useState } from 'react';
import { X, Loader2, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';

interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loan: any;
}

export default function RepaymentModal({ isOpen, onClose, onSuccess, loan }: RepaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  if (!isOpen || !loan) return null;

  const remainingBalance = loan.totalReceivable - (loan.repaidAmount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) {
      toast.error('Please enter an amount');
      return;
    }

    const payAmount = parseFloat(form.amount);
    if (payAmount <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }

    if (payAmount > remainingBalance + 0.01) { // small buffer for floating point
      toast.error(`Amount exceeds remaining balance of ₹${remainingBalance.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/loans/${loan._id}/repayments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Repayment recorded');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to record repayment');
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
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Record Repayment</h2>
            <p className="text-xs text-[var(--text-secondary)]">For: {loan.borrowerName}</p>
          </div>
          <button onClick={onClose} className="transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 flex items-center justify-between bg-[var(--bg-primary)] border-b border-[var(--border)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Remaining Balance</span>
            <span className="font-bold text-[var(--accent)]">₹{remainingBalance.toLocaleString()}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-5">
          <div>
            <label className="label">Amount Paid Back</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="number"
                step="any"
                className="input pl-10"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {[500, 1000, 5000, 10000].map(amt => (
                    <button
                        key={amt}
                        type="button"
                        onClick={() => setForm({ ...form, amount: Math.min(amt, remainingBalance).toString() })}
                        className="text-[10px] px-2 py-1 rounded-md whitespace-nowrap transition-colors bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
                    >
                        ₹{amt.toLocaleString()}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => setForm({ ...form, amount: remainingBalance.toString() })}
                    className="text-[10px] px-2 py-1 rounded-md whitespace-nowrap transition-colors bg-[var(--bg-card)] text-[var(--accent)] border border-[var(--border)] hover:bg-[var(--bg-primary)] hover:text-white"
                >
                    Full Balance
                </button>
            </div>
          </div>

          <div>
            <label className="label">Payment Date</label>
            <input
              type="date"
              className="input"
              value={form.paymentDate}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Notes (Optional)</label>
            <input
              type="text"
              className="input"
              placeholder="Installment #, Cash, Bank, etc."
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
