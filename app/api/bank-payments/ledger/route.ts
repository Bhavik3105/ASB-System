import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Client from '@/models/Client';
import BankPayment from '@/models/BankPayment';

export async function GET() {
  try {
    await connectDB();

    // 1. Aggregate Total Due (Buying Price) from Clients by Reference
    const dueByReference = await Client.aggregate([
      { $match: { reference: { $ne: null, $ne: '' } } },
      { $group: { _id: '$reference', totalDue: { $sum: '$buyingPrice' } } }
    ]);

    // 2. Aggregate Total Paid from BankPayments by Reference
    const paidByReference = await BankPayment.aggregate([
      { $group: { _id: '$referenceName', totalPaid: { $sum: '$amount' } } }
    ]);

    // 3. Merge Results
    const references = Array.from(new Set([
      ...dueByReference.map(r => r._id),
      ...paidByReference.map(r => r._id)
    ]));

    const ledger = references.map(name => {
      const due = dueByReference.find(r => r._id === name)?.totalDue || 0;
      const paid = paidByReference.find(r => r._id === name)?.totalPaid || 0;
      return {
        referenceName: name,
        totalDue: due,
        totalPaid: paid,
        balance: due - paid
      };
    }).sort((a, b) => b.balance - a.balance);

    return NextResponse.json({ success: true, data: ledger });
  } catch (error) {
    console.error('Ledger API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
