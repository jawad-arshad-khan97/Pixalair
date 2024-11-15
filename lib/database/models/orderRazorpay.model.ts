import { Document, Schema, model, models } from "mongoose";

export interface IOrderRazorpay extends Document {
  _id: string;
  order_id: string;
  amount: Number;
  currency: string;
  buyerId: string;
  razorpay_signature: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
}

const Orderschema = new Schema({
  order_id: { type: String, required: true },
  amount: { type: Number },
  currency: { type: String },
  buyerId: { type: String },
  razorpay_signature: { type: String },
  razorpay_payment_id: { type: String },
  razorpay_order_id: { type: String },
});

const Order = models?.OrderRazorpay || model("OrderRazorpay", Orderschema);

export default Order;
