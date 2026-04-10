import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const clientId = searchParams.get('clientId');
    const bankId = searchParams.get('bankId');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (type) filter.type = type;
    if (clientId) filter.clientId = clientId;
    if (bankId) filter.bankId = bankId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('clientId', 'personName')
        .populate('bankId', 'bankName')
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await requireAuth();
    const body = await request.json();
    const { type, amount, commission, date, reference, clientId, bankId } = body;

    if (!type || amount == null || commission == null || !date) {
      return NextResponse.json({ success: false, error: 'type, amount, commission, date are required' }, { status: 400 });
    }
    if (!['Deposit', 'Withdrawal'].includes(type)) {
      return NextResponse.json({ success: false, error: 'type must be Deposit or Withdrawal' }, { status: 400 });
    }

    const transaction = await Transaction.create({
      type, amount: Number(amount), commission: Number(commission),
      date: new Date(date), reference, clientId, bankId,
      createdBy: session.userId,
    });

    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
