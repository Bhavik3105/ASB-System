import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BankPayment from '@/models/BankPayment';
import { requireAuth } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    await requireAuth();
    const { id } = await params;
    
    const deleted = await BankPayment.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 });
    
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error('Delete Bank Payment error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
