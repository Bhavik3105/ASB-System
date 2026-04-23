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
    
    // Delete the employee
    const deleted = await Employee.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    
    // Cascade delete: Remove all associated salary records
    // We import Salary dynamically to avoid circular dependencies if any, or just import it at the top. 
    // Wait, the file doesn't have it at top. I'll just use mongoose.model.
    const mongoose = require('mongoose');
    const Salary = mongoose.models.Salary || mongoose.model('Salary');
    await Salary.deleteMany({ employeeId: id });
    
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
