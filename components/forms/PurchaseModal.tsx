'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function PurchaseModal({ isOpen, onClose, onSuccess, initialData }: PurchaseModalProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const defaultForm = {
    title: '',
    clientId: '',
    type: 'Buy',
    totalAmount: '',
    paidAmount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  };
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/clients')
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setClients(json.data);
        })
        .catch(() => console.error('Failed to load clients'));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          ...initialData,
          clientId: initialData.clientId || '',
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
      const url = initialData ? `/api/purchases/${initialData._id}` : '/api/purchases';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          clientId: form.clientId || undefined,
          totalAmount: parseFloat(form.totalAmount as string),
          paidAmount: form.paidAmount ? parseFloat(form.paidAmount as string) : 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Purchase ${initialData ? 'updated' : 'added'} successfully!`);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || `Failed to ${initialData ? 'update' : 'add'} purchase`);
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
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{initialData ? 'Edit Purchase' : 'Add Purchase'}</h2>
          <button onClick={onClose} className="transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Item or service name"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Client (Optional)</label>
                <select
                  className="select"
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                >
                  <option value="">Select a Client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.personName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Type</label>
                <select
                  className="select"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  required
                >
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Paid Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={form.paidAmount}
                  onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Notes (Optional)</label>
              <textarea
                className="input min-h-[80px] resize-none"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !form.title || !form.totalAmount}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? 'Update Purchase' : 'Save Purchase')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
