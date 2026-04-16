'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search as SearchIcon, 
  Users, 
  Building2, 
  Wallet, 
  ArrowRight, 
  Loader2, 
  Receipt, 
  Landmark, 
  CreditCard, 
  UserCircle 
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any>({ 
    clients: [], 
    banks: [], 
    commissions: [],
    expenses: [],
    loans: [],
    payments: [],
    employees: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
        <p className="text-slate-400 animate-pulse">Searching across ASB System...</p>
      </div>
    );
  }

  const hasResults = Object.values(results).some((arr: any) => arr.length > 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <SearchIcon className="w-6 h-6 text-cyan-500" /> 
            Search Results
          </h1>
          <p className="page-subtitle">
            Showing results for <span className="text-cyan-400 font-medium font-mono">"{query}"</span>
          </p>
        </div>
      </div>

      {!hasResults ? (
        <div className="card text-center py-20">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
            <SearchIcon className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">No matching records found</h2>
          <p className="text-slate-500 max-w-sm mx-auto">
            We couldn't find anything matching your search. Try a different name, date, or amount.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Clients Section */}
          {results.clients?.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2 px-2">
                <Users className="w-5 h-5 text-cyan-500" />
                <h2 className="font-semibold text-lg">Found in Clients ({results.clients.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.clients.map((client: any) => (
                  <Link key={client._id} href={`/clients?search=${encodeURIComponent(client.personName)}`} 
                    className="card p-4 hover:border-cyan-500/50 hover:bg-cyan-500/5 group transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">{client.personName}</h3>
                        <p className="text-xs text-slate-500">{client.mobileNumber}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-cyan-500 transition-all group-hover:translate-x-1" />
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50">
                      <span className="text-xs text-slate-500">Deposit Amt:</span>
                      <span className="text-sm font-semibold text-emerald-400">{formatCurrency(client.depositAmount)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Banks Section */}
          {results.banks?.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2 px-2">
                <Building2 className="w-5 h-5 text-purple-500" />
                <h2 className="font-semibold text-lg">Found in Banks ({results.banks.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.banks.map((bank: any) => (
                  <Link key={bank._id} href="/banks" 
                    className="card p-4 hover:border-purple-500/50 hover:bg-purple-500/5 group transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-100 group-hover:text-purple-400 transition-colors">{bank.bankName}</h3>
                        <p className="text-xs text-slate-500">{bank.accountHolderName}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-purple-500 transition-all group-hover:translate-x-1" />
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-mono">{bank.accountNumber}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Expenses Section */}
          {results.expenses?.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2 px-2">
                <Receipt className="w-5 h-5 text-rose-500" />
                <h2 className="font-semibold text-lg">Found in Expenses ({results.expenses.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.expenses.map((expense: any) => (
                  <Link key={expense._id} href="/expenses" 
                    className="card p-4 hover:border-rose-500/50 hover:bg-rose-500/5 group transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-100 group-hover:text-rose-400 transition-colors">{expense.title}</h3>
                        <p className="text-xs text-slate-500">{expense.type}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-rose-500 transition-all group-hover:translate-x-1" />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-slate-500">{formatDate(expense.date)}</span>
                      <span className="text-sm font-semibold text-rose-400">{formatCurrency(expense.amount)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Loans Section */}
          {results.loans?.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2 px-2">
                <Landmark className="w-5 h-5 text-indigo-500" />
                <h2 className="font-semibold text-lg">Found in Loans ({results.loans.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.loans.map((loan: any) => (
                  <Link key={loan._id} href="/loans" 
                    className="card p-4 hover:border-indigo-500/50 hover:bg-indigo-500/5 group transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">{loan.borrowerName}</h3>
                        <p className="text-xs text-slate-500">{loan.status}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-indigo-500 transition-all group-hover:translate-x-1" />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-slate-500">Principal:</span>
                      <span className="text-sm font-semibold text-indigo-400">{formatCurrency(loan.principalAmount)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Bank Payments Section */}
          {results.payments?.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2 px-2">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                <h2 className="font-semibold text-lg">Found in Bank Payments ({results.payments.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.payments.map((payment: any) => (
                  <Link key={payment._id} href="/bank-payments" 
                    className="card p-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 group transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">{payment.referenceName}</h3>
                        <p className="text-xs text-slate-500">{payment.paymentMode}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-slate-500">{formatDate(payment.date)}</span>
                      <span className="text-sm font-semibold text-emerald-400">{formatCurrency(payment.amount)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Employees Section */}
          {results.employees?.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2 px-2">
                <UserCircle className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold text-lg">Found in Employees ({results.employees.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.employees.map((emp: any) => (
                  <Link key={emp._id} href="/salary" 
                    className="card p-4 hover:border-amber-500/50 hover:bg-amber-500/5 group transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-100 group-hover:text-amber-400 transition-colors">{emp.name}</h3>
                        <p className="text-xs text-slate-500">{emp.mobileNumber || 'No mobile'}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-amber-500 transition-all group-hover:translate-x-1" />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800/50">
                      <span className="text-xs text-slate-500">Base Salary:</span>
                      <p className="text-sm font-semibold text-amber-500">{formatCurrency(emp.baseSalary)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Commissions Section */}
          {results.commissions?.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2 px-2">
                <Wallet className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold text-lg">Found in Commissions ({results.commissions.length})</h2>
              </div>
              <div className="table-wrapper card px-0 py-0 overflow-hidden">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-slate-800/50">
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-right">Total Daily Business</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.commissions.map((comm: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-800/30 transition-colors group border-t border-slate-800/50">
                        <td className="px-6 py-4 font-mono text-cyan-400">{formatDate(comm._id)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-amber-400 font-bold">{formatCurrency(comm.totalAmount)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/commissions?startDate=${comm._id}&endDate=${comm._id}`} 
                            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                            View Daily Log <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
