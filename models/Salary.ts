import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISalary extends Document {
  employeeId: mongoose.Types.ObjectId;
  month: number; // 0-11 for JS Date months or 1-12
  year: number;
  baseSalarySnapshot: number;
  advanceAmount: number;
  bonusAmount: number;
  isPaid: boolean;
  paidDate?: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
}

const SalarySchema = new Schema<ISalary>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    baseSalarySnapshot: { type: Number, required: true, min: 0 },
    advanceAmount: { type: Number, default: 0, min: 0 },
    bonusAmount: { type: Number, default: 0, min: 0 },
    isPaid: { type: Boolean, default: false },
    paidDate: { type: Date },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Prevent duplicate records for same employee/month/year
SalarySchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

const Salary: Model<ISalary> =
  mongoose.models.Salary || mongoose.model<ISalary>('Salary', SalarySchema);
export default Salary;
