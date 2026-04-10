import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Client from '@/models/Client';
import Bank from '@/models/Bank';
import Transaction from '@/models/Transaction';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ success: true, data: { clients: [], banks: [], commissions: [] } });
    }

    const regex = { $regex: q, $options: 'i' };

    // 1. Search Clients
    const clientsPromise = Client.aggregate([
      {
        $addFields: {
          amountString: { $toString: '$depositAmount' },
          dateString: { $dateToString: { format: '%Y-%m-%d', date: '$openDate' } }
        }
      },
      {
        $match: {
          $or: [
            { personName: regex },
            { mobileNumber: regex },
            { email: regex },
            { reference: regex },
            { amountString: regex },
            { dateString: regex }
          ]
        }
      },
      { $limit: 20 }
    ]);

    // 2. Search Banks
    const banksPromise = Bank.find({
      $or: [
        { bankName: regex },
        { accountHolderName: regex },
        { accountNumber: regex },
        { mobileNumber: regex },
        { emailId: regex }
      ]
    }).limit(20).lean();

    // 3. Search Commissions (Transactions aggregated by day)
    const commissionsPromise = Transaction.aggregate([
      {
        $lookup: {
          from: 'banks',
          localField: 'bankId',
          foreignField: '_id',
          as: 'bankInfo'
        }
      },
      { $unwind: '$bankInfo' },
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'clientInfo'
        }
      },
      { $unwind: { path: '$clientInfo', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          amountString: { $toString: '$amount' },
          dateString: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
        }
      },
      {
        $match: {
          $or: [
            { 'bankInfo.bankName': regex },
            { 'bankInfo.accountHolderName': regex },
            { 'clientInfo.personName': regex },
            { amountString: regex },
            { dateString: regex },
            { type: regex }
          ]
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': -1 } },
      { $limit: 20 }
    ]);

    const [clients, banks, commissions] = await Promise.all([
      clientsPromise,
      banksPromise,
      commissionsPromise
    ]);

    return NextResponse.json({
      success: true,
      data: {
        clients,
        banks,
        commissions
      }
    });
  } catch (error) {
    console.error('Global search error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
