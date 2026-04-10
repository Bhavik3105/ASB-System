import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Purchase from '@/models/Purchase';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (clientId) filter.clientId = clientId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const [purchases, total] = await Promise.all([
      Purchase.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('clientId', 'personName mobileNumber')
        .populate('bankId', 'bankName')
        .lean({ virtuals: true }),
      Purchase.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: purchases,
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
    const { title, type, clientId, bankId, totalAmount, paidAmount, date, dueDate, notes } = body;

    if (!title || !type || totalAmount == null || !date) {
      return NextResponse.json({ success: false, error: 'title, type, totalAmount, date are required' }, { status: 400 });
    }
    if (!['Buy', 'Sell'].includes(type)) {
      return NextResponse.json({ success: false, error: 'type must be Buy or Sell' }, { status: 400 });
    }

    const paid = Number(paidAmount || 0);
    const purchase = new Purchase({
      title, type, clientId, bankId,
      totalAmount: Number(totalAmount), paidAmount: paid,
      date: new Date(date), dueDate: dueDate ? new Date(dueDate) : undefined,
      notes, createdBy: session.userId,
      paymentHistory: paid > 0 ? [{ amount: paid, date: new Date(date), paidBy: session.userId }] : [],
    });
    await purchase.save();

    return NextResponse.json({ success: true, data: purchase }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
