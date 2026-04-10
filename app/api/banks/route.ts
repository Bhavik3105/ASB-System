import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/db';
import Bank from '@/models/Bank';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const search = searchParams.get('search');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (search) {
      filter.$or = [
        { bankName: { $regex: search, $options: 'i' } },
        { accountHolderName: { $regex: search, $options: 'i' } },
        { accountNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [banks, total] = await Promise.all([
      Bank.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Bank.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: banks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await requireAuth();
    const body = await request.json();
    const { bankName, accountHolderName, accountNumber, qrStatus, dailyLimit, notes } = body;

    if (!bankName || !accountHolderName || !accountNumber) {
      return NextResponse.json(
        { success: false, error: 'bankName, accountHolderName, accountNumber are required' },
        { status: 400 }
      );
    }

    const bank = await Bank.create({
      bankName, accountHolderName, accountNumber,
      qrStatus,
      dailyLimit: Number(dailyLimit || 0),
      notes,
      createdBy: session.userId,
    });

    return NextResponse.json({ success: true, data: bank }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
