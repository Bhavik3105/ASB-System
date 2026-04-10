import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import Expense from '@/models/Expense';
import { getStartOfMonth, getEndOfMonth } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const start = startDate ? new Date(startDate) : getStartOfMonth();
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : getEndOfMonth();

    const [transactions, expenses] = await Promise.all([
      Transaction.find({ date: { $gte: start, $lte: end } })
        .populate('clientId', 'personName')
        .populate('bankId', 'bankName')
        .lean(),
      Expense.find({ date: { $gte: start, $lte: end } }).lean(),
    ]);

    const totalCommission = transactions.reduce((s, t) => s + t.commission, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    // Return structured JSON for client-side PDF generation
    return NextResponse.json({
      success: true,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        summary: {
          totalCommission,
          totalExpenses,
          netProfit: totalCommission - totalExpenses,
        },
        transactions,
        expenses,
      },
    });
  } catch (error) {
    console.error('PDF data error:', error);
    return NextResponse.json({ success: false, error: 'Report generation failed' }, { status: 500 });
  }
}
