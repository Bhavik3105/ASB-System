import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBankPayment extends Document {
  referenceName: string;
  amount: number;
  date: Date;
  paymentMode?: string;
  note?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BankPaymentSchema = new Schema<IBankPayment>(
  {
    referenceName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    paymentMode: { type: String, trim: true },
    note: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

BankPaymentSchema.index({ referenceName: 1 });
BankPaymentSchema.index({ date: -1 });

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as any).BankPayment;
}

const BankPayment: Model<IBankPayment> = mongoose.models.BankPayment || mongoose.model<IBankPayment>('BankPayment', BankPaymentSchema);
export default BankPayment;
