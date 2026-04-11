import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import Expense from '@/models/Expense';
import Client from '@/models/Client';
import Salary from '@/models/Salary';
import { getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month'); // e.g., "04"
    const yearParam = searchParams.get('year');   // e.g., "2026"

    const today = new Date();
    let targetMonth = today.getMonth() + 1;
    let targetYear = today.getFullYear();
    
    if (monthParam && yearParam) {
      targetMonth = parseInt(monthParam);
      targetYear = parseInt(yearParam);
    }
    
    const targetDate = new Date(targetYear, targetMonth - 1, 1);

    const startDay = getStartOfDay(today); 
    const endDay = getEndOfDay(today); 
    const startMonth = getStartOfMonth(targetDate);
    const endMonth = getEndOfMonth(targetDate);

    // ── 1. DAILY STATS ───────────────────────────────────────────────
    const dailyCommissionResult = await Transaction.aggregate([
      { $match: { date: { $gte: startDay, $lte: endDay } } },
      { $group: { _id: null, total: { $sum: '$commission' } } },
    ]);
    const totalDailyCommission = dailyCommissionResult[0]?.total ?? 0;

    // ── 2. MONTHLY STATS ─────────────────────────────────────────────
    // Monthly commission
    const monthlyCommissionResult = await Transaction.aggregate([
      { $match: { date: { $gte: startMonth, $lte: endMonth } } },
      { $group: { _id: null, total: { $sum: '$commission' } } },
    ]);
    const totalMonthlyCommission = monthlyCommissionResult[0]?.total ?? 0;

    // Monthly expenses (General)
    const monthlyExpensesResult = await Expense.aggregate([
      { $match: { date: { $gte: startMonth, $lte: endMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalMonthlyExpenses = monthlyExpensesResult[0]?.total ?? 0;

    // Monthly salaries (All generated)
    const monthlySalariesResult = await Salary.aggregate([
      { $match: { month: targetMonth, year: targetYear } },
      {
        $group: {
          _id: null,
          total: { $sum: { $subtract: [{ $add: ['$baseSalarySnapshot', '$bonusAmount'] }, '$advanceAmount'] } }
        }
      }
    ]);
    const totalMonthlySalaries = monthlySalariesResult[0]?.total ?? 0;

    // Monthly Buying Prices (Bank Purchases)
    const monthlyBuyingPricesResult = await Client.aggregate([
      { $match: { date: { $gte: startMonth, $lte: endMonth } } },
      { $group: { _id: null, total: { $sum: '$buyingPrice' } } }
    ]);
    const totalMonthlyBuyingPrices = monthlyBuyingPricesResult[0]?.total ?? 0;

    // Net monthly profit calculation
    const netMonthlyProfit = totalMonthlyCommission - (totalMonthlyExpenses + totalMonthlySalaries + totalMonthlyBuyingPrices);

    // ── 3. YEARLY STATS (Cumulative Profit) ──────────────────────────
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    // Annual Commissions
    const annualCommissions = await Transaction.aggregate([
      { $match: { date: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: null, total: { $sum: '$commission' } } }
    ]);
    // Annual Expenses
    const annualExpenses = await Expense.aggregate([
      { $match: { date: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    // Annual Salaries
    const annualSalaries = await Salary.aggregate([
      { $match: { year: targetYear } },
      { $group: { _id: null, total: { $sum: { $subtract: [{ $add: ['$baseSalarySnapshot', '$bonusAmount'] }, '$advanceAmount'] } } } }
    ]);
    // Annual Buying Prices
    const annualBuyingPrices = await Client.aggregate([
      { $match: { date: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: null, total: { $sum: '$buyingPrice' } } }
    ]);

    const totalYearlyProfit = (annualCommissions[0]?.total ?? 0) - 
                             ((annualExpenses[0]?.total ?? 0) + (annualSalaries[0]?.total ?? 0) + (annualBuyingPrices[0]?.total ?? 0));

    // ── 4. VISUALIZATION DATA ────────────────────────────────────────
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

    const expenseBreakdown = await Expense.aggregate([
      { $match: { date: { $gte: startMonth, $lte: endMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalDailyCommission,
        totalMonthlyCommission,
        totalMonthlyExpenses,
        totalMonthlySalaries,
        totalMonthlyBuyingPrices,
        netMonthlyProfit,
        totalYearlyProfit,
        dailyChartData,
        expenseBreakdown,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
