import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import Expense from '@/models/Expense';
import Purchase from '@/models/Purchase';
import { getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month'); // e.g., "04"
    const yearParam = searchParams.get('year');   // e.g., "2026"

    const today = new Date();
    let targetDate = new Date();
    if (monthParam && yearParam) {
      targetDate = new Date(parseInt(yearParam), parseInt(monthParam) - 1, 1);
    }

    const startDay = getStartOfDay(today); 
    const endDay = getEndOfDay(today); 
    const startMonth = getStartOfMonth(targetDate);
    const endMonth = getEndOfMonth(targetDate);

    // Daily commission
    const dailyCommissionResult = await Transaction.aggregate([
      { $match: { date: { $gte: startDay, $lte: endDay } } },
      { $group: { _id: null, total: { $sum: '$commission' } } },
    ]);
    const totalDailyCommission = dailyCommissionResult[0]?.total ?? 0;

    // Monthly commission
    const monthlyCommissionResult = await Transaction.aggregate([
      { $match: { date: { $gte: startMonth, $lte: endMonth } } },
      { $group: { _id: null, total: { $sum: '$commission' } } },
    ]);
    const totalMonthlyCommission = monthlyCommissionResult[0]?.total ?? 0;

    // Monthly expenses
    const monthlyExpensesResult = await Expense.aggregate([
      { $match: { date: { $gte: startMonth, $lte: endMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalMonthlyExpenses = monthlyExpensesResult[0]?.total ?? 0;

    // Net monthly profit
    const netMonthlyProfit = totalMonthlyCommission - totalMonthlyExpenses;

    // Daily chart data (last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyChartData = await Transaction.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo, $lte: endDay } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          commission: { $sum: '$commission' },
          deposits: { $sum: { $cond: [{ $eq: ['$type', 'Deposit'] }, '$commission', 0] } },
          withdrawals: { $sum: { $cond: [{ $eq: ['$type', 'Withdrawal'] }, '$commission', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Expense breakdown by type
    const expenseBreakdown = await Expense.aggregate([
      { $match: { date: { $gte: startMonth, $lte: endMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    // Pending purchases count
    const pendingPurchases = await Purchase.countDocuments({ status: { $in: ['Pending', 'Partially Paid'] } });

    return NextResponse.json({
      success: true,
      data: {
        totalDailyCommission,
        totalMonthlyCommission,
        totalMonthlyExpenses,
        netMonthlyProfit,
        dailyChartData,
        expenseBreakdown,
        pendingPurchases,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
