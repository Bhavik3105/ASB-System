import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Expense from '@/models/Expense';
import { requireAuth } from '@/lib/auth';

// GET /api/expenses?page=1&limit=20&type=Business&startDate=&endDate=
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: expenses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET expenses error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/expenses
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await requireAuth();
    const body = await request.json();

    const { title, amount, type, date } = body;
    if (!title || amount == null || !type || !date) {
      return NextResponse.json({ success: false, error: 'title, amount, type, date are required' }, { status: 400 });
    }
    if (!['Home', 'Business'].includes(type)) {
      return NextResponse.json({ success: false, error: 'type must be Home or Business' }, { status: 400 });
    }
    if (amount < 0) {
      return NextResponse.json({ success: false, error: 'amount must be non-negative' }, { status: 400 });
    }

    const expense = await Expense.create({
      title,
      amount: Number(amount),
      type,
      date: new Date(date),
      createdBy: session.userId,
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error) {
    console.error('POST expense error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
