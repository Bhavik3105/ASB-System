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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const updated = await BankPayment.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update Bank Payment error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
