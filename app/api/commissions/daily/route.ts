import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Default filters: Current month
    const filter: any = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const dailyStats = await Transaction.aggregate([
      { $match: filter },
      // Group by year, month, and day for the date
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          deposits: {
            $sum: { $cond: [{ $eq: ["$type", "Deposit"] }, "$amount", 0] }
          },
          depositCommission: {
            $sum: { $cond: [{ $eq: ["$type", "Deposit"] }, "$commission", 0] }
          },
          withdrawals: {
            $sum: { $cond: [{ $eq: ["$type", "Withdrawal"] }, "$amount", 0] }
          },
          withdrawalCommission: {
            $sum: { $cond: [{ $eq: ["$type", "Withdrawal"] }, "$commission", 0] }
          },
          totalDailyCommission: { $sum: "$commission" }
        }
      },
      // Project the final fields
      {
        $project: {
          _id: 0,
          date: "$_id",
          deposits: 1,
          depositCommission: 1,
          withdrawals: 1,
          withdrawalCommission: 1,
          totalDailyCommission: 1
        }
      },
      { $sort: { date: -1 } }
    ]);

    return NextResponse.json({ success: true, data: dailyStats });
  } catch (error) {
    console.error('Daily commissions error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
