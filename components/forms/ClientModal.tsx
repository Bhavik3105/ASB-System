'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function ClientModal({ isOpen, onClose, onSuccess, initialData }: ClientModalProps) {
  const [loading, setLoading] = useState(false);
  const defaultForm = {
    personName: '',
    mobileNumber: '',
    email: '',
    bankType: '',
    reference: '',
    depositAmount: '',
    buyingPrice: '',
    businessType: '',
    status: 'Active',
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
      const url = initialData ? `/api/clients/${initialData._id}` : '/api/clients';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          depositAmount: form.depositAmount ? parseFloat(form.depositAmount as string) : 0,
          buyingPrice: form.buyingPrice ? parseFloat(form.buyingPrice as string) : 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Bank Purchase ${initialData ? 'updated' : 'added'} successfully!`);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || `Failed to ${initialData ? 'update' : 'add'} bank purchase`);
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
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{initialData ? 'Edit Bank Purchase' : 'Add Bank Purchase'}</h2>
          <button onClick={onClose} className="transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="label">Person Name</label>
              <input
                type="text"
                className="input"
                value={form.personName}
                onChange={(e) => setForm({ ...form, personName: e.target.value })}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Mobile Number</label>
                <input
                  type="text"
                  className="input"
                  value={form.mobileNumber}
                  onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Bank Type</label>
                <select
                  className="select"
                  value={form.bankType}
                  onChange={(e) => setForm({ ...form, bankType: e.target.value })}
                >
                  <option value="">Select Type</option>
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                </select>
              </div>
              <div>
                <label className="label">Reference</label>
                <input
                  type="text"
                  className="input"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Deposit Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={form.depositAmount}
                  onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Buying Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={form.buyingPrice}
                  onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Business Type</label>
                <input
                  type="text"
                  className="input"
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                >
                  <option value="Active">Active</option>
                  <option value="Frozen">Frozen</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Purchase Date</label>
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
            <button type="submit" className="btn-primary" disabled={loading || !form.personName || !form.mobileNumber}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? 'Update Record' : 'Save Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
