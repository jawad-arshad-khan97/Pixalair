/* eslint-disable camelcase */
import { createTransaction } from "@/lib/actions/transaction.actions";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.TEST_RAZORPAY_KEY_ID as string,
  key_secret: process.env.TEST_RAZORPAY_KEY_SECRET,
});

export async function POST(request: Request) {
  const body = await request.text();

  const signature = request.headers.get("x-razorpay-signature") as string;
  const endpointSecret = process.env.TEST_RAZORPAY_WEBHOOK_SECRET!;

  try {
    Razorpay.validateWebhookSignature(body, signature, endpointSecret);
  } catch (err) {
    return NextResponse.json({
      message: "Invalid webhook signature",
      error: err,
    });
  }

  // Get the ID and type
  const event = typeof body === "string" ? JSON.parse(body) : body;
  const eventType = event.event;

  // CREATE
  if (eventType === "payment.captured") {
    const { id, amount, notes } = event.payload.payment.entity;

    const transaction = {
      razorpayId: id,
      amount: amount ? amount / 100 : 0,
      plan: notes?.plan || "",
      credits: Number(notes?.credits) || 0,
      buyerId: notes?.buyerId || "",
      createdAt: new Date(),
    };

    const razorpaySignatureParams = {
      razorpay_order_id: event.payload.payment.entity.order_id, // ensure this matches Razorpay’s payload structure
      razorpay_payment_id: id,
      razorpay_signature: signature,
    };

    const newTransaction = await createTransaction(
      transaction,
      razorpaySignatureParams
    );

    return NextResponse.json({ message: "OK", transaction: newTransaction });
  }

  return new Response("", { status: 200 });
}
