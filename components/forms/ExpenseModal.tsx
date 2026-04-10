'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function ExpenseModal({ isOpen, onClose, onSuccess, initialData }: ExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const defaultForm = {
    title: '',
    amount: '',
    type: 'Home' as 'Home' | 'Business',
    date: new Date().toISOString().split('T')[0],
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
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData ? `/api/expenses/${initialData._id}` : '/api/expenses';
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
        toast.success(`Expense ${initialData ? 'updated' : 'added'} successfully!`);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || `Failed to ${initialData ? 'update' : 'add'} expense`);
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
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{initialData ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="label">Title / Description</label>
              <input
                type="text"
                className="input"
                placeholder="What was this expense for?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Type</label>
                <select
                  className="select"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'Home' | 'Business' })}
                  required
                >
                  <option value="Home">Home</option>
                  <option value="Business">Business</option>
                </select>
              </div>
              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !form.title || !form.amount}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? 'Update Expense' : 'Save Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
