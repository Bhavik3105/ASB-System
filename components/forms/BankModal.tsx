'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function BankModal({ isOpen, onClose, onSuccess, initialData }: BankModalProps) {
  const [loading, setLoading] = useState(false);
  const defaultForm = {
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    qrStatus: 'Active',
    dailyLimit: 0,
    notes: '',
  };
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          bankName: initialData.bankName || '',
          accountHolderName: initialData.accountHolderName || '',
          accountNumber: initialData.accountNumber || '',
          qrStatus: initialData.qrStatus || 'Active',
          dailyLimit: initialData.dailyLimit || 0,
          notes: initialData.notes || '',
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
      const url = initialData ? `/api/banks/${initialData._id}` : '/api/banks';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Bank ${initialData ? 'updated' : 'added'} successfully!`);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || `Failed to ${initialData ? 'update' : 'add'} bank`);
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
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{initialData ? 'Edit Bank Account' : 'Add Bank Account'}</h2>
          <button onClick={onClose} className="transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="label">Bank Name</label>
              <input
                type="text"
                className="input"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="label">Account Holder Name</label>
              <input
                type="text"
                className="input"
                value={form.accountHolderName}
                onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Account Number</label>
                <input
                  type="text"
                  className="input !bg-slate-900/30"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">QR Status</label>
                <select
                  className="select !bg-slate-900/30"
                  value={form.qrStatus}
                  onChange={(e) => setForm({ ...form, qrStatus: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Freeze">Freeze</option>
                  <option value="KYC">KYC</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Daily Limit (₹)</label>
              <input
                type="number"
                className="input !bg-slate-900/30"
                placeholder="500000"
                value={form.dailyLimit}
                onChange={(e) => setForm({ ...form, dailyLimit: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="label">Daily Limit (₹)</label>
              <input
                type="number"
                className="input"
                placeholder="500000"
                value={form.dailyLimit}
                onChange={(e) => setForm({ ...form, dailyLimit: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="label">Notes (Optional)</label>
              <textarea
                className="input min-h-[80px] resize-none !bg-slate-900/30"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !form.bankName || !form.accountNumber}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? 'Update Bank' : 'Save Bank')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
