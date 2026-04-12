import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BankPayment from '@/models/BankPayment';
import { requireAuth } from '@/lib/auth';
import { getStartOfDay, getEndOfDay } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const reference = searchParams.get('reference');

    const query: any = {};
    if (reference) query.referenceName = reference;
    if (search) {
      query.$or = [
        { referenceName: { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } }
      ];
    }

    const payments = await BankPayment.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    console.error('Bank Payments API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await requireAuth();
    const body = await request.json();
    const { referenceName, amount, date, paymentMode, note } = body;

    if (!referenceName || !amount || !date) {
      return NextResponse.json({ success: false, error: 'referenceName, amount, and date are required' }, { status: 400 });
    }

    const payment = await BankPayment.create({
      referenceName,
      amount: Number(amount),
      date: new Date(date),
      paymentMode,
      note,
      createdBy: session.userId,
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    console.error('Bank Payments API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
