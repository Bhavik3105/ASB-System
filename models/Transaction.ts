import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  type: 'Deposit' | 'Withdrawal';
  amount: number;
  commission: number;
  date: Date;
  reference?: string;
  clientId?: mongoose.Types.ObjectId;
  bankId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    type: { type: String, enum: ['Deposit', 'Withdrawal'], required: true },
    amount: { type: Number, required: true, min: 0 },
    commission: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    reference: { type: String, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    bankId: { type: Schema.Types.ObjectId, ref: 'Bank' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

TransactionSchema.index({ date: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ date: 1, type: 1 });
TransactionSchema.index({ clientId: 1 });
TransactionSchema.index({ bankId: 1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema);
export default Transaction;
