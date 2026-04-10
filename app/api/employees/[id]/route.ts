import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/db';
import Employee from '@/models/Employee';
import { requireAuth } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    
    const updated = await Employee.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    
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
    
    // We do a soft delete or hard delete?
    // User said "delete option i salary section, if sometime client want to delete the entry he should be able to do it"
    // And to my proposal "delete Employee record entirely" they said "ok do it"
    
    const deleted = await Employee.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
