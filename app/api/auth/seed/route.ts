import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';

// POST /api/auth/seed — creates the first superadmin (only if no users exist)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const count = await User.countDocuments();
    if (count > 0) {
      return NextResponse.json(
        { success: false, error: 'Seed already done. Users already exist.' },
        { status: 403 }
      );
    }

    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'name, email and password are required' },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, role: 'superadmin' });

    return NextResponse.json({
      success: true,
      message: 'Superadmin created successfully',
      data: { name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
