import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/db';
import Loan from '@/models/Loan';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const loans = await Loan.find({ createdBy: session.userId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: loans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    
    // Auto-calculate values for safety in case client didn't do it
    const interestAmount = (body.principalAmount * body.interestRate) / 100;
    const totalReceivable = body.principalAmount + interestAmount;

    const loan = await Loan.create({
      ...body,
      interestAmount,
      totalReceivable,
      createdBy: session.userId
    });

    return NextResponse.json({ success: true, data: loan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
