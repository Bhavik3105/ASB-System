import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Client from '@/models/Client';

export async function GET() {
  try {
    await connectDB();
    
    // Get distinct reference names from the Client model
    const references = await Client.distinct('reference', { reference: { $ne: null, $ne: '' } });
    
    return NextResponse.json({ success: true, data: references.sort() });
  } catch (error) {
    console.error('References API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
