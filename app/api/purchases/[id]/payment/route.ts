import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Purchase from '@/models/Purchase';
import { requireAuth } from '@/lib/auth';

// POST /api/purchases/:id/payment — add a partial payment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await requireAuth();
    const { id } = await params;
    const { amount, notes } = await request.json();

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: 'Payment amount must be positive' }, { status: 400 });
    }

    const purchase = await Purchase.findById(id);
    if (!purchase) return NextResponse.json({ success: false, error: 'Purchase not found' }, { status: 404 });
    if (purchase.status === 'Paid') {
      return NextResponse.json({ success: false, error: 'This purchase is already fully paid' }, { status: 400 });
    }

    const paymentAmount = Math.min(Number(amount), purchase.totalAmount - purchase.paidAmount);
    purchase.paidAmount += paymentAmount;
    purchase.paymentHistory.push({
      amount: paymentAmount,
      date: new Date(),
      notes,
      paidBy: session.userId as unknown as import('mongoose').Types.ObjectId,
    });

    await purchase.save(); // triggers pre-save hook → auto-updates status

    return NextResponse.json({ success: true, data: purchase });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
