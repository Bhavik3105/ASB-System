import mongoose, { Schema, Document, Model } from 'mongoose';

interface IPaymentEntry {
  amount: number;
  date: Date;
  notes?: string;
  paidBy: mongoose.Types.ObjectId;
}

export interface IPurchase extends Document {
  title: string;
  type: 'Buy' | 'Sell';
  clientId?: mongoose.Types.ObjectId;
  bankId?: mongoose.Types.ObjectId;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number; // virtual
  date: Date;
  dueDate?: Date;
  paymentHistory: IPaymentEntry[];
  status: 'Paid' | 'Partially Paid' | 'Pending';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentEntrySchema = new Schema<IPaymentEntry>(
  {
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: true }
);

const PurchaseSchema = new Schema<IPurchase>(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Buy', 'Sell'], required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    bankId: { type: Schema.Types.ObjectId, ref: 'Bank' },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    date: { type: Date, required: true },
    dueDate: { type: Date },
    paymentHistory: [PaymentEntrySchema],
    status: {
      type: String,
      enum: ['Paid', 'Partially Paid', 'Pending'],
      default: 'Pending',
    },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: pendingAmount is always derived, never stored
PurchaseSchema.virtual('pendingAmount').get(function (this: IPurchase) {
  return Math.max(0, this.totalAmount - this.paidAmount);
});

// Pre-save hook: auto-compute status and cap paidAmount
PurchaseSchema.pre('save', function () {
  if (this.paidAmount > this.totalAmount) this.paidAmount = this.totalAmount;
  if (this.paidAmount <= 0) {
    this.status = 'Pending';
  } else if (this.paidAmount >= this.totalAmount) {
    this.status = 'Paid';
  } else {
    this.status = 'Partially Paid';
  }
});

PurchaseSchema.index({ status: 1 });
PurchaseSchema.index({ clientId: 1 });
PurchaseSchema.index({ date: 1 });
PurchaseSchema.index({ dueDate: 1 });

const Purchase: Model<IPurchase> =
  mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema);
export default Purchase;
