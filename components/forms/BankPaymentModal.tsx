'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BankPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function BankPaymentModal({ isOpen, onClose, onSuccess, initialData }: BankPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [references, setReferences] = useState<string[]>([]);
  const [fetchingRefs, setFetchingRefs] = useState(false);

  const defaultForm = {
    referenceName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    note: '',
  };
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          ...initialData,
          date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : defaultForm.date,
        });
      } else {
        setForm(defaultForm);
      }
      fetchReferences();
    }
  }, [isOpen, initialData]);

  const fetchReferences = async () => {
    try {
      setFetchingRefs(true);
      const res = await fetch('/api/bank-payments/references');
      const json = await res.json();
      if (json.success) {
        setReferences(json.data);
      }
    } catch {
      toast.error('Failed to load parties');
    } finally {
      setFetchingRefs(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData ? `/api/bank-payments/${initialData._id}` : '/api/bank-payments';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount as string),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Payment recorded successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to record payment');
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
        <div className="modal-header">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{initialData ? 'Edit Bank Payment' : 'Add Bank Payment'}</h2>
          <button onClick={onClose} className="transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="label">Party Name (Reference)</label>
              <select
                className="select"
                value={form.referenceName}
                onChange={(e) => setForm({ ...form, referenceName: e.target.value })}
                required
                disabled={fetchingRefs}
              >
                <option value="">Select Party</option>
                {references.map((ref) => (
                  <option key={ref} value={ref}>{ref}</option>
                ))}
              </select>
              {references.length === 0 && !fetchingRefs && (
                <p className="mt-1 text-[10px] text-amber-500 font-medium">No parties found in Bank Purchases. Please add a purchase first.</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Amount Paid</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Payment Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Payment Mode</label>
                <select
                  className="select"
                  value={form.paymentMode}
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Transfer">Transfer</option>
                </select>
              </div>
              <div>
                <label className="label">Note / Remarks</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Payment details..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !form.referenceName || !form.amount}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? 'Update Payment' : 'Save Payment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
