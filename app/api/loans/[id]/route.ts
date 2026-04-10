import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/db';
import Loan from '@/models/Loan';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Auto-calculate interest and total receivable for safety
    const interestAmount = (body.principalAmount * body.interestRate) / 100;
    const totalReceivable = body.principalAmount + interestAmount;

    const updated = await Loan.findOneAndUpdate(
      { _id: id, createdBy: session.userId },
      { ...body, interestAmount, totalReceivable },
      { new: true, runValidators: true }
    );

    if (!updated) return NextResponse.json({ success: false, error: 'Loan not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const deleted = await Loan.findOneAndDelete({ _id: id, createdBy: session.userId });

    if (!deleted) return NextResponse.json({ success: false, error: 'Loan not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
