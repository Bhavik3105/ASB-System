import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILoan extends Document {
  borrowerName: string;
  principalAmount: number;
  interestRate: number; // Percentage
  interestAmount: number; // Principal * (Rate/100)
  totalReceivable: number; // Principal + InterestAmount
  repaidAmount: number;
  startDate: Date;
  duration: string; // e.g., "6 Months"
  status: 'Active' | 'Settled';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Force model re-registration for development
if (mongoose.models.Loan) {
  delete mongoose.models.Loan;
}

const LoanSchema = new Schema<ILoan>(
  {
    borrowerName: { type: String, required: true, trim: true },
    principalAmount: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true, min: 0 },
    interestAmount: { type: Number, required: true, min: 0 },
    totalReceivable: { type: Number, required: true, min: 0 },
    repaidAmount: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, required: true, default: Date.now },
    duration: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Active', 'Settled'], default: 'Active' },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Auto-calculate interest and total using async hook (cleaner, no 'next')
LoanSchema.pre('save', async function() {
  if (this.isModified('principalAmount') || this.isModified('interestRate')) {
    this.interestAmount = (this.principalAmount * this.interestRate) / 100;
    this.totalReceivable = this.principalAmount + this.interestAmount;
  }
  
  if (this.repaidAmount >= this.totalReceivable) {
    this.status = 'Settled';
  } else {
    this.status = 'Active';
  }
});

const Loan: Model<ILoan> =
  mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);

export default Loan;
