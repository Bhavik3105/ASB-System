import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Client from '@/models/Client';
import Bank from '@/models/Bank'; 
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const search = searchParams.get('search');
    const bankId = searchParams.get('bankId');

    // SAFE LIST MODE: If no search or bank filter, use stable find()
    if (!search && !bankId) {
      const [clients, total] = await Promise.all([
        Client.find({})
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('banks', 'bankName accountHolderName accountNumber')
          .lean(),
        Client.countDocuments({}),
      ]);

      return NextResponse.json({
        success: true,
        data: clients,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    // ADVANCED SEARCH MODE: Use robust aggregation
    const pipeline: any[] = [];

    // Lookup banks for search and population
    pipeline.push(
      {
        $lookup: {
          from: 'banks',
          localField: 'banks',
          foreignField: '_id',
          as: 'bankDetails'
        }
      }
    );

    // Prepare search fields
    if (search) {
      pipeline.push({
        $addFields: {
          amountString: { $toString: { $ifNull: ['$depositAmount', 0] } },
          dateString: { 
            $cond: [
              { $gt: ['$openDate', null] },
              { $dateToString: { format: '%Y-%m-%d', date: '$openDate' } },
              ''
            ]
          },
          bankDetailsLookup: { $ifNull: ['$bankDetails', []] }
        }
      });

      pipeline.push({
        $addFields: {
          bankNames: {
            $reduce: {
              input: '$bankDetailsLookup',
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
            { email: { $regex: search, $options: 'i' } },
            { reference: { $regex: search, $options: 'i' } },
            { amountString: { $regex: search, $options: 'i' } },
            { dateString: { $regex: search, $options: 'i' } },
            { bankNames: { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    if (bankId) {
      try {
        pipeline.push({ $match: { banks: new mongoose.Types.ObjectId(bankId) } });
      } catch {
        // Handle invalid ObjectId
      }
    }

    // Pagination and Sort
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              amountString: 0,
              dateString: 0,
              bankNames: 0,
              bankDetailsLookup: 0,
              bankDetails: 1
            }
          }
        ]
      }
    });

    const result = await Client.aggregate(pipeline);
    const clients = result[0]?.data || [];
    const total = result[0]?.metadata[0]?.total || 0;

    const mappedClients = clients.map((c: any) => ({
      ...c,
      banks: c.bankDetails || []
    }));

    return NextResponse.json({
      success: true,
      data: mappedClients,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Clients API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await requireAuth();
    const body = await request.json();
    const { personName, banks, mobileNumber, email, bankType, reference, documents, depositAmount, businessType, openDate, totalAmount } = body;

    if (!personName || !mobileNumber || !openDate) {
      return NextResponse.json({ success: false, error: 'personName, mobileNumber, openDate are required' }, { status: 400 });
    }

    const client = await Client.create({
      personName, banks: banks || [], mobileNumber, email, bankType,
      reference, documents, depositAmount: Number(depositAmount || 0), businessType,
      openDate: new Date(openDate), totalAmount: Number(totalAmount || 0),
      createdBy: session.userId,
    });

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
