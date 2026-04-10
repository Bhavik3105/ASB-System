import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILoanRepayment extends Document {
  loanId: mongoose.Types.ObjectId;
  amount: number;
  paymentDate: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Force model re-registration for development
if (mongoose.models.LoanRepayment) {
  delete mongoose.models.LoanRepayment;
}

const LoanRepaymentSchema = new Schema<ILoanRepayment>(
  {
    loanId: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const LoanRepayment: Model<ILoanRepayment> =
  mongoose.models.LoanRepayment || mongoose.model<ILoanRepayment>('LoanRepayment', LoanRepaymentSchema);

export default LoanRepayment;
