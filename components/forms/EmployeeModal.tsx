'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function EmployeeModal({ isOpen, onClose, onSuccess, initialData }: EmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const defaultForm = {
    name: '',
    baseSalary: '',
    mobileNumber: '',
    joiningDate: new Date().toISOString().split('T')[0],
  };
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          ...initialData,
          joiningDate: initialData.joiningDate ? new Date(initialData.joiningDate).toISOString().split('T')[0] : defaultForm.joiningDate,
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
      const url = initialData ? `/api/employees/${initialData._id}` : '/api/employees';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          baseSalary: parseFloat(form.baseSalary.toString() || '0'),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Employee ${initialData ? 'updated' : 'added'} successfully!`);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || `Failed to ${initialData ? 'update' : 'add'} employee`);
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
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{initialData ? 'Edit Employee' : 'Add Employee'}</h2>
          <button onClick={onClose} className="transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="label">Employee Name</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Base Salary</label>
                <input
                  type="number"
                  className="input"
                  value={form.baseSalary}
                  onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Mobile Number</label>
                <input
                  type="text"
                  className="input"
                  value={form.mobileNumber}
                  onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Joining Date</label>
              <input
                type="date"
                className="input"
                value={form.joiningDate}
                onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !form.name || !form.baseSalary}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? 'Update Record' : 'Save Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
