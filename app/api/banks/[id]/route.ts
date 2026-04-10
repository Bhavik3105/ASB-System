import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/db';
import Bank from '@/models/Bank';
import { requireAuth } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    
    // Explicitly handle dailyLimit to ensure casting
    const updateData = { ...body };
    if (updateData.dailyLimit !== undefined) {
      updateData.dailyLimit = Number(updateData.dailyLimit || 0);
    }

    const updated = await Bank.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ success: false, error: 'Bank not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    await requireAuth();
    const { id } = await params;
    const deleted = await Bank.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, error: 'Bank not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
