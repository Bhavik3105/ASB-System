import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBank extends Document {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  qrStatus?: string;
  dailyLimit: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BankSchema = new Schema<IBank>(
  {
    bankName: { type: String, required: true, trim: true },
    accountHolderName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    qrStatus: { type: String, default: 'Active', trim: true },
    dailyLimit: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

BankSchema.index({ bankName: 1 });
BankSchema.index({ accountNumber: 1 });

// Force delete cached model to apply schema changes in development
if (mongoose.models.Bank) {
  delete mongoose.models.Bank;
}

const Bank: Model<IBank> = mongoose.model<IBank>('Bank', BankSchema);

export default Bank;
