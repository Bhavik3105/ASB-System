import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import Expense from '@/models/Expense';
import Client from '@/models/Client';
import Bank from '@/models/Bank';
import Loan from '@/models/Loan';
import Salary from '@/models/Salary';
import Employee from '@/models/Employee';
import BankPayment from '@/models/BankPayment';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module') || 'all';
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;

    // Build date range from month/year if provided, else use startDate/endDate raw params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateFilter: any = {};
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      dateFilter.date = { $gte: start, $lte: end };
    } else {
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      if (startDate || endDate) {
        dateFilter.date = {};
        if (startDate) dateFilter.date.$gte = new Date(startDate);
        if (endDate) dateFilter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    const workbook = XLSX.utils.book_new();
    const dateLabel = month && year ? `${month}-${year}` : new Date().toISOString().split('T')[0];

    // ── TRANSACTIONS (Commissions) ──────────────────────────────────
    if (module === 'all' || module === 'transactions' || module === 'commissions') {
      const transactions = await Transaction.find(dateFilter)
        .populate('clientId', 'personName')
        .populate('bankId', 'bankName')
        .sort({ date: -1 })
        .lean();
      const data = transactions.map((t) => ({
        Date: new Date(t.date).toLocaleDateString('en-IN'),
        Type: t.type,
        Amount: t.amount,
        Commission: t.commission,
        Reference: t.reference || '',
        Client: (t.clientId as { personName?: string } | null)?.personName || '',
        Bank: (t.bankId as { bankName?: string } | null)?.bankName || '',
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.length ? data : [{}]), 'Commissions');
    }

    // ── EXPENSES ───────────────────────────────────────────────────
    if (module === 'all' || module === 'expenses') {
      const expenses = await Expense.find(dateFilter).sort({ date: -1 }).lean();
      const data = expenses.map((e) => ({
        Date: new Date(e.date).toLocaleDateString('en-IN'),
        Title: e.title,
        Type: e.type,
        Amount: e.amount,
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.length ? data : [{}]), 'Expenses');
    }

    // ── CLIENTS ────────────────────────────────────────────────────
    if (module === 'all' || module === 'clients') {
      const clients = await Client.find({}).lean();
      const data = clients.map((c) => ({
        Name: c.personName,
        Mobile: c.mobileNumber,
        Email: c.email || '',
        'Bank Type': c.bankType || '',
        Reference: c.reference || '',
        Date: new Date(c.date).toLocaleDateString('en-IN'),
        'Deposit Amount': c.depositAmount,
        'Buying Price': c.buyingPrice || 0,
        'Total Amount': c.totalAmount,
        'Business Type': c.businessType || '',
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.length ? data : [{}]), 'Clients');
    }

    // ── BANKS ──────────────────────────────────────────────────────
    if (module === 'all' || module === 'banks') {
      const banks = await Bank.find({}).lean();
      const data = banks.map((b) => ({
        'Bank Name': b.bankName,
        'Account Holder': b.accountHolderName,
        'Account Number': b.accountNumber,
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.length ? data : [{}]), 'Banks');
    }

    // ── BANK LIMITS ───────────────────────────────────────────────────
    if (module === 'all' || module === 'bank-limits') {
      const bankLimits = await Bank.find({}).lean();
      const data = bankLimits.map((b) => ({
        'Bank Name': b.bankName,
        'Account Holder': b.accountHolderName,
        'Limit (₹)': b.dailyLimit || 0,
        'Use Limit (₹)': b.useLimit || 0,
        'Daily Limit (₹)': Math.max(0, (b.dailyLimit || 0) - (b.useLimit || 0)),
        Status: b.isActive ? 'Active' : 'Inactive',
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.length ? data : [{}]), 'Bank Limits');
    }


    // ── LOANS ──────────────────────────────────────────────────────
    if (module === 'all' || module === 'loans') {
      const loanFilter = month && year
        ? { startDate: { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0, 23, 59, 59, 999) } }
        : {};
      const loans = await Loan.find(module === 'loans' && (month || year) ? loanFilter : {})
        .sort({ startDate: -1 })
        .lean();
      const data = loans.map((l) => ({
        'Borrower Name': l.borrowerName,
        'Start Date': new Date(l.startDate).toLocaleDateString('en-IN'),
        Duration: l.duration,
        'Principal (₹)': l.principalAmount,
        'Interest Rate (%)': l.interestRate,
        'Interest Amount (₹)': l.interestAmount,
        'Total Receivable (₹)': l.totalReceivable,
        'Repaid Amount (₹)': l.repaidAmount,
        'Outstanding (₹)': l.totalReceivable - l.repaidAmount,
        Status: l.status,
        Notes: l.notes || '',
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.length ? data : [{}]), 'Loans');
    }

    // ── SALARY ─────────────────────────────────────────────────────
    if (module === 'all' || module === 'salary') {
      const salaryFilter: Record<string, unknown> = {};
      if (month) salaryFilter.month = month;
      if (year) salaryFilter.year = year;

      const salaries = await Salary.find(salaryFilter)
        .populate('employeeId', 'name baseSalary')
        .lean();

      const data = salaries.map((s) => {
        const emp = s.employeeId as { name?: string; baseSalary?: number } | null;
        const net = (s.baseSalarySnapshot || 0) + (s.bonusAmount || 0) - (s.advanceAmount || 0);
        return {
          Employee: emp?.name || '',
          Month: s.month,
          Year: s.year,
          'Base Salary (₹)': s.baseSalarySnapshot,
          'Advance Taken (₹)': s.advanceAmount || 0,
          'Bonus (₹)': s.bonusAmount || 0,
          'Net Payable (₹)': net,
          Status: s.isPaid ? 'Paid' : 'Pending',
          'Paid Date': s.paidDate ? new Date(s.paidDate).toLocaleDateString('en-IN') : '',
          Notes: s.notes || '',
        };
      });
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.length ? data : [{}]), 'Salary');
    }

    // ── BANK PAYMENTS ──────────────────────────────────────────────
    if (module === 'all' || module === 'bank-payments') {
      const payments = await BankPayment.find(dateFilter).sort({ date: -1 }).lean();
      const data = payments.map((p) => ({
        Date: new Date(p.date).toLocaleDateString('en-IN'),
        Party: p.referenceName,
        Amount: p.amount,
        Mode: p.paymentMode || '',
        Note: p.note || '',
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.length ? data : [{}]), 'Bank Payments');

      if (module === 'bank-payments' || module === 'all') {
        const dueByRef = await Client.aggregate([{ $group: { _id: '$reference', due: { $sum: '$buyingPrice' } } }]);
        const paidByRef = await BankPayment.aggregate([{ $group: { _id: '$referenceName', paid: { $sum: '$amount' } } }]);
        const refs = Array.from(new Set([...dueByRef.map(r => r._id), ...paidByRef.map(r => r._id)]));
        const ledger = refs.filter(r => r).map(name => {
          const due = dueByRef.find(r => r._id === name)?.due || 0;
          const paid = paidByRef.find(r => r._id === name)?.paid || 0;
          return { Party: name, 'Total Due': due, 'Total Paid': paid, Balance: due - paid };
        });
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(ledger.length ? ledger : [{}]), 'Bank Ledger');
      }
    }

    // Ensure at least one sheet exists
    if (workbook.SheetNames.length === 0) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ Note: 'No data found' }]), 'Empty');
    }

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const moduleLabel = module === 'all' ? 'full-export' : module;
    const filename = `asb-${moduleLabel}-${dateLabel}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json({ success: false, error: 'Export failed' }, { status: 500 });
  }
}
