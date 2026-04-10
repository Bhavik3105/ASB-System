import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Client from '@/models/Client';
import Bank from '@/models/Bank'; 
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const bankId = searchParams.get('bankId');

    // 1. Diagnostics: Check raw collection count
    const rawCount = await Client.countDocuments({});

    // 2. Simple List Mode
    if (!search && !bankId) {
      const clients = await Client.find({})
        .sort({ createdAt: -1 })
        .populate('banks', 'bankName accountHolderName accountNumber')
        .lean();

      return NextResponse.json({
        success: true,
        data: clients,
        _debug: { rawCount },
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      });
    }

    // 3. Search Mode (Simplified Aggregation)
    const pipeline: any[] = [
      {
        $lookup: {
          from: 'banks',
          localField: 'banks',
          foreignField: '_id',
          as: 'bankDetails'
        }
      }
    ];

    if (search) {
      pipeline.push({
        $addFields: {
          dateString: { $dateToString: { format: '%Y-%m-%d', date: '$date', onNull: '' } },
          bankNames: {
            $reduce: {
              input: '$bankDetails',
              initialValue: '',
              in: { $concat: ['$$value', ' ', { $ifNull: ['$$this.bankName', ''] }] }
            }
          }
        }
      });

      pipeline.push({
        $match: {
          $or: [
            { personName: { $regex: search, $options: 'i' } },
            { mobileNumber: { $regex: search, $options: 'i' } },
            { reference: { $regex: search, $options: 'i' } },
            { dateString: { $regex: search, $options: 'i' } },
            { bankNames: { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    if (bankId) {
      try {
        pipeline.push({ $match: { banks: new mongoose.Types.ObjectId(bankId) } });
      } catch (e) {}
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    const clients = await Client.aggregate(pipeline);

    return NextResponse.json({
      success: true,
      data: clients.map(c => ({ ...c, banks: c.bankDetails })),
      _debug: { rawCount },
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });

  } catch (error: any) {
    console.error('Clients API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await requireAuth();
    const body = await request.json();
    const { personName, banks, mobileNumber, email, bankType, reference, depositAmount, businessType, date, totalAmount } = body;

    if (!personName || !mobileNumber || !date) {
      return NextResponse.json({ success: false, error: 'personName, mobileNumber, date are required' }, { status: 400 });
    }

    const client = await Client.create({
      personName, banks: banks || [], mobileNumber, email, bankType,
      reference, depositAmount: Number(depositAmount || 0), businessType,
      date: new Date(date), totalAmount: Number(totalAmount || 0),
      createdBy: session.userId,
    });

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error: any) {
    console.error('Clients API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
