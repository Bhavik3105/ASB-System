import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
  title: string;
  amount: number;
  type: 'Home' | 'Business';
  date: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['Home', 'Business'], required: true },
    date: { type: Date, required: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: 1 });
ExpenseSchema.index({ type: 1 });
ExpenseSchema.index({ date: 1, type: 1 });

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
export default Expense;
