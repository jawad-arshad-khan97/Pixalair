import { Schema, model, models } from "mongoose";

const TransactionSchema = new Schema({
  created_at: {
    type: Date,
    default: Date.now,
  },
  razorpay_id: {
    type: String,
    required: true,
    unique: true,
  },
  razorpay_payment_id: {
    type: String,
    required: true,
    unique: true,
  },
  razorpay_order_id: {
    type: String,
    required: true,
    unique: true,
  },
  razorpay_signature: {
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
  buyer: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const Transaction =
  models?.Transaction || model("Transaction", TransactionSchema);

export default Transaction;
