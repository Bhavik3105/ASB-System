import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Employee from '@/models/Employee';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { isActive: true };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const employees = await Employee.find(filter).sort({ name: 1 }).lean();

    return NextResponse.json({ success: true, data: employees });
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
    const { name, baseSalary, mobileNumber, joiningDate } = body;

    if (!name || !baseSalary) {
      return NextResponse.json({ success: false, error: 'Name and Base Salary are required' }, { status: 400 });
    }

    const employee = await Employee.create({
      name, baseSalary, mobileNumber,
      joiningDate: joiningDate || new Date(),
      createdBy: session.userId,
    });

    return NextResponse.json({ success: true, data: employee }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
