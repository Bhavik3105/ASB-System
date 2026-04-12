import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Client from '@/models/Client';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    await requireAuth();

    // Explicitly ensure models are registered
    if (!mongoose.models.Client) console.log('Registering Client model manually...');
    
    // Get distinct reference names from the Client model
    const references = await Client.distinct('reference', { reference: { $ne: null, $ne: '' } });
    
    return NextResponse.json({ success: true, data: references.sort() });
  } catch (error) {
    console.error('References API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
