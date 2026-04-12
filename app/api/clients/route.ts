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
    
    // Explicitly ensure models are registered
    if (!mongoose.models.Bank) {
      console.log('Registering Bank model manually...');
    }
    if (!mongoose.models.Client) {
      console.log('Registering Client model manually...');
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const bankId = searchParams.get('bankId');

    // 1. Diagnostics: Check raw collection count
    // Use the raw collection to bypass Mongoose schema issues if any
    const rawCount = mongoose.connection.db 
      ? await mongoose.connection.db.collection('clients').countDocuments({})
      : 0;

    // 2. Simple List Mode
    if (!search && !bankId) {
      const clients = await Client.find({})
        .sort({ createdAt: -1 })
        .populate({
           path: 'banks',
           model: Bank, // Explicitly provide the model to avoid "Schema not found"
           select: 'bankName accountHolderName accountNumber'
        })
        .lean();

      return NextResponse.json({
        success: true,
        data: clients,
        _debug: { rawCount, mode: 'list' },
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
          // Fallback date string logic
          dateString: { 
            $cond: [
              { $ifNull: ['$date', false] },
              { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              ''
            ]
          },
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
      _debug: { rawCount, mode: 'search' },
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });

  } catch (error: any) {
    console.error('Clients API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await requireAuth();
    const body = await request.json();
    const { personName, banks, mobileNumber, email, bankType, reference, depositAmount, buyingPrice, businessType, date, totalAmount, status } = body;

    if (!personName || !mobileNumber || !date) {
      return NextResponse.json({ success: false, error: 'personName, mobileNumber, date are required' }, { status: 400 });
    }

    const client = await Client.create({
      personName, banks: banks || [], mobileNumber, email, bankType,
      reference, 
      depositAmount: Number(depositAmount || 0), 
      buyingPrice: Number(buyingPrice || 0),
      businessType,
      date: new Date(date), totalAmount: Number(totalAmount || 0),
      status: status || 'Active',
      createdBy: session.userId,
    });

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error: any) {
    console.error('Clients API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
