'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function TransactionModal({ isOpen, onClose, onSuccess, initialData }: TransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const defaultForm = {
    type: 'Deposit',
    amount: '',
    commission: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    clientId: '',
    bankId: '',
  };
  const [form, setForm] = useState(defaultForm);
  const [banks, setBanks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [bankSearch, setBankSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showBankResults, setShowBankResults] = useState(false);
  const [showClientResults, setShowClientResults] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          fetch('/api/banks'),
          fetch('/api/clients')
        ]);
        const [bData, cData] = await Promise.all([bRes.json(), cRes.json()]);
        if (bData.success) setBanks(bData.data);
        if (cData.success) setClients(cData.data);
      } catch (err) {
        console.error('Failed to fetch modal data', err);
      }
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  const filteredBanks = banks.filter((b: any) => 
    b.bankName.toLowerCase().includes(bankSearch.toLowerCase()) || 
    b.accountHolderName.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const filteredClients = clients.filter((c: any) => 
    c.personName.toLowerCase().includes(clientSearch.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          ...initialData,
          date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : defaultForm.date,
        });
        // Find and set search strings if data exists
        const b = banks.find((bank: any) => bank._id === initialData.bankId);
        if (b) setBankSearch(b.bankName);
        const c = clients.find((client: any) => client._id === initialData.clientId);
        if (c) setClientSearch(c.personName);
      } else {
        setForm(defaultForm);
        setBankSearch('');
        setClientSearch('');
      }
    }
  }, [isOpen, initialData, banks, clients]);

  // Calculate commission automatically based on type and amount
  useEffect(() => {
    const amt = parseFloat(form.amount as string);
    if (!isNaN(amt) && amt > 0) {
      if (form.type === 'Deposit') {
        // 3.25% for deposit
        setForm((prev) => ({ ...prev, commission: (amt * 0.0325).toFixed(2) }));
      } else if (form.type === 'Withdrawal') {
        // 1.5% for withdrawal
        setForm((prev) => ({ ...prev, commission: (amt * 0.015).toFixed(2) }));
      }
    } else {
      setForm((prev) => ({ ...prev, commission: '' }));
    }
  }, [form.amount, form.type]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData ? `/api/transactions/${initialData._id}` : '/api/transactions';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount as string),
          commission: parseFloat(form.commission as string),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Transaction ${initialData ? 'updated' : 'added'} successfully!`);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || `Failed to ${initialData ? 'update' : 'add'} transaction`);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{initialData ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={onClose} className="transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="label">Type</label>
              <select
                className="select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
              >
                <option value="Deposit">Deposit</option>
                <option value="Withdrawal">Withdrawal</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Searchable Bank Field */}
              <div className="relative">
                <label className="label">Bank (Required for Reports)</label>
                <div className="relative">
                  <input
                    type="text"
                    className="input pr-10"
                    placeholder="Type to search bank..."
                    value={bankSearch}
                    onFocus={() => setShowBankResults(true)}
                    onBlur={() => setTimeout(() => setShowBankResults(false), 200)}
                    onChange={(e) => {
                      setBankSearch(e.target.value);
                      setShowBankResults(true);
                      if (!e.target.value) setForm(prev => ({ ...prev, bankId: '' }));
                    }}
                  />
                  {form.bankId && (
                    <button 
                      type="button" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      onClick={() => { setBankSearch(''); setForm(prev => ({ ...prev, bankId: '' })); }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                {showBankResults && bankSearch && (
                  <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredBanks.length > 0 ? (
                      filteredBanks.map((b: any) => (
                        <div
                          key={b._id}
                          className="px-4 py-2 hover:bg-slate-800 cursor-pointer text-sm text-slate-200 border-b border-slate-800/50 last:border-0"
                          onClick={() => {
                            setForm({ ...form, bankId: b._id });
                            setBankSearch(b.bankName);
                            setShowBankResults(false);
                          }}
                        >
                          <div className="font-medium">{b.bankName}</div>
                          <div className="text-xs text-slate-500">{b.accountHolderName}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500 italic text-center">No banks found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Searchable Client Field */}
              <div className="relative">
                <label className="label">Client (Optional)</label>
                <div className="relative">
                  <input
                    type="text"
                    className="input pr-10"
                    placeholder="Type to search client..."
                    value={clientSearch}
                    onFocus={() => setShowClientResults(true)}
                    onBlur={() => setTimeout(() => setShowClientResults(false), 200)}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowClientResults(true);
                      if (!e.target.value) setForm(prev => ({ ...prev, clientId: '' }));
                    }}
                  />
                  {form.clientId && (
                    <button 
                      type="button" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      onClick={() => { setClientSearch(''); setForm(prev => ({ ...prev, clientId: '' })); }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {showClientResults && clientSearch && (
                  <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((c: any) => (
                        <div
                          key={c._id}
                          className="px-4 py-2 hover:bg-slate-800 cursor-pointer text-sm text-slate-200 border-b border-slate-800/50 last:border-0"
                          onClick={() => {
                            setForm({ ...form, clientId: c._id });
                            setClientSearch(c.personName);
                            setShowClientResults(false);
                          }}
                        >
                          {c.personName}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500 italic text-center">No clients found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="label">Amount</label>
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
              <label className="label flex items-center justify-between">
                <span>Commission</span>
                <span className="text-cyan-400 text-xs">
                  {form.type === 'Deposit' ? '3.25% auto-calculated' : '1.5% auto-calculated'}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input bg-slate-900/50"
                placeholder="0.00"
                value={form.commission}
                readOnly
              />
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

            <div>
              <label className="label">Reference (Optional)</label>
              <input
                type="text"
                className="input"
                placeholder="Transaction ID, remarks, etc."
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !form.amount || !form.bankId}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? 'Update Transaction' : 'Save Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
