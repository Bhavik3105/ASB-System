import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import { requireAuth } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json({ success: false, error: 'Date is required' }, { status: 400 });
    }
    
    // Parse the date and create a range for the whole day
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    const result = await Transaction.deleteMany({
      date: { $gte: start, $lte: end }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `${result.deletedCount} transactions deleted for ${date}`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
