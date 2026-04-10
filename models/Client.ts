import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClient extends Document {
  personName: string;
  mobileNumber: string;
  email?: string;
  bankType?: string;
  reference?: string;
  banks: mongoose.Types.ObjectId[];
  price: number;
  depositAmount: number;
  businessType?: string;
  date: Date;
  totalAmount: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    personName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    bankType: { type: String, trim: true },
    reference: { type: String, trim: true },
    banks: [{ type: Schema.Types.ObjectId, ref: 'Bank' }],
    price: { type: Number, default: 0, min: 0 },
    depositAmount: { type: Number, default: 0, min: 0 },
    businessType: { type: String, trim: true },
    date: { type: Date, required: true },
    totalAmount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ClientSchema.index({ personName: 1 });
ClientSchema.index({ mobileNumber: 1 });
ClientSchema.index({ banks: 1 });
// Full-text search index
ClientSchema.index(
  { personName: 'text', mobileNumber: 'text', email: 'text', reference: 'text' },
  { name: 'client_text_search' }
);

// Force delete cached model to apply schema changes in development
if (mongoose.models.Client) {
  delete mongoose.models.Client;
}

const Client: Model<IClient> = mongoose.model<IClient>('Client', ClientSchema);
export default Client;
