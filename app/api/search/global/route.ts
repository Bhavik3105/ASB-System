import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Client from '@/models/Client';
import Bank from '@/models/Bank';
import Transaction from '@/models/Transaction';
import Expense from '@/models/Expense';
import Loan from '@/models/Loan';
import BankPayment from '@/models/BankPayment';
import Employee from '@/models/Employee';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ 
        success: true, 
        data: { 
          clients: [], 
          banks: [], 
          commissions: [],
          expenses: [],
          loans: [],
          payments: [],
          employees: []
        } 
      });
    }

    const regex = { $regex: q, $options: 'i' };

    // 1. Search Clients
    const clientsPromise = Client.find({
      $or: [
        { personName: regex },
        { mobileNumber: regex },
        { email: regex },
        { reference: regex }
      ]
    }).limit(20).lean();

    // 2. Search Banks
    const banksPromise = Bank.find({
      $or: [
        { bankName: regex },
        { accountHolderName: regex },
        { accountNumber: regex },
        { mobileNumber: regex },
        { emailId: regex }
      ]
    }).limit(20).lean();

    // 3. Search Commissions (Transactions aggregated by day)
    const commissionsPromise = Transaction.aggregate([
      {
        $lookup: {
          from: 'banks',
          localField: 'bankId',
          foreignField: '_id',
          as: 'bankInfo'
        }
      },
      { $unwind: '$bankInfo' },
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'clientInfo'
        }
      },
      { $unwind: { path: '$clientInfo', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          amountString: { $toString: '$amount' },
          dateString: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
        }
      },
      {
        $match: {
          $or: [
            { 'bankInfo.bankName': regex },
            { 'bankInfo.accountHolderName': regex },
            { 'clientInfo.personName': regex },
            { amountString: regex },
            { dateString: regex },
            { type: regex }
          ]
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': -1 } },
      { $limit: 20 }
    ]);

    // 4. Search Expenses
    const expensesPromise = Expense.find({
      $or: [
        { title: regex },
        { notes: regex },
        { type: regex }
      ]
    }).sort({ date: -1 }).limit(20).lean();

    // 5. Search Loans
    const loansPromise = Loan.find({
      $or: [
        { borrowerName: regex },
        { notes: regex },
        { duration: regex },
        { status: regex }
      ]
    }).sort({ createdAt: -1 }).limit(20).lean();

    // 6. Search Bank Payments
    const paymentsPromise = BankPayment.find({
      $or: [
        { referenceName: regex },
        { note: regex },
        { paymentMode: regex }
      ]
    }).sort({ date: -1 }).limit(20).lean();

    // 7. Search Employees
    const employeesPromise = Employee.find({
      $or: [
        { name: regex },
        { mobileNumber: regex }
      ]
    }).limit(20).lean();

    const [clients, banks, commissions, expenses, loans, payments, employees] = await Promise.all([
      clientsPromise,
      banksPromise,
      commissionsPromise,
      expensesPromise,
      loansPromise,
      paymentsPromise,
      employeesPromise
    ]);

    return NextResponse.json({
      success: true,
      data: {
        clients,
        banks,
        commissions,
        expenses,
        loans,
        payments,
        employees
      }
    });
  } catch (error) {
    console.error('Global search error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
