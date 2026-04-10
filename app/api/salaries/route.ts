import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/db';
import Salary from '@/models/Salary';
import Employee from '@/models/Employee';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Fetch all active employees
    const employees = await Employee.find({ isActive: true }).sort({ name: 1 }).lean();
    
    // Fetch salary records for the selected month/year
    const salaries = await Salary.find({ month, year }).lean();

    // Map salaries to employees
    const merged = employees.map(emp => {
      const sal = salaries.find(s => s.employeeId.toString() === emp._id.toString());
      return {
        ...emp,
        salaryRecord: sal || {
          month,
          year,
          baseSalarySnapshot: emp.baseSalary,
          advanceAmount: 0,
          bonusAmount: 0,
          isPaid: false,
        }
      };
    });

    return NextResponse.json({ success: true, data: merged });
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
    const { employeeId, month, year, advanceAmount, bonusAmount, isPaid, notes, baseSalarySnapshot } = body;

    if (!employeeId || month === undefined || year === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert salary record
    const salary = await Salary.findOneAndUpdate(
      { employeeId, month, year },
      {
        $set: {
          baseSalarySnapshot,
          advanceAmount: parseFloat(advanceAmount || 0),
          bonusAmount: parseFloat(bonusAmount || 0),
          isPaid,
          paidDate: isPaid ? new Date() : undefined,
          notes,
          createdBy: session.userId,
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: salary });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing salary record ID' }, { status: 400 });
    }

    const deleted = await Salary.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Salary record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
