import { Document, Schema, model, models } from "mongoose";

// Define TypeScript interface for Transaction schema
export interface ITransaction extends Document {
  _id: string;
  razorpayId: string;
  created_at?: Date;
  order_id: string;
  amount: number;
  plan?: string;
  credits?: number;
  buyerId: Schema.Types.ObjectId;
}

// Define Mongoose schema based on the interface
const TransactionSchema = new Schema<ITransaction>({
  razorpayId: {
    type: String,
    required: true,
    unique: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  order_id: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  plan: {
    type: String,
  },
  credits: {
    type: Number,
  },
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

// Export the Transaction model
const Transaction =
  models?.Transaction || model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
