import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/db';
import Loan from '@/models/Loan';
import LoanRepayment from '@/models/LoanRepayment';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const repayments = await LoanRepayment.find({ loanId: id }).sort({ paymentDate: -1 });

    return NextResponse.json({ success: true, data: repayments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const amount = Number(body.amount);

    // 1. Create repayment record
    const repayment = await LoanRepayment.create({
      loanId: id,
      amount,
      paymentDate: body.paymentDate || new Date(),
      notes: body.notes,
      createdBy: session.userId
    });

    // 2. Update the total repaid amount in the Loan model
    // Using $inc for atomicity
    await Loan.findByIdAndUpdate(id, {
      $inc: { repaidAmount: amount }
    });

    // Note: The 'pre-save' hook in Loan model will handle status 'Settled' update if needed
    // However, since findByIdAndUpdate doesn't trigger 'save' hooks, let's refresh and check
    const updatedLoan = await Loan.findById(id);
    if (updatedLoan && updatedLoan.repaidAmount >= updatedLoan.totalReceivable) {
      updatedLoan.status = 'Settled';
      await updatedLoan.save();
    }

    return NextResponse.json({ success: true, data: repayment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
