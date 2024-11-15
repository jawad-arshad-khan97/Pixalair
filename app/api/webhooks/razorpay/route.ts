/* eslint-disable camelcase */
import { createTransaction } from "@/lib/actions/transaction.actions";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  const body = await request.text();

  const signature = request.headers.get("x-razorpay-signature") as string;
  const endpointSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  var isSignatureValid = Razorpay.validateWebhookSignature(
    body,
    signature,
    endpointSecret
  );

  if (!isSignatureValid) {
    throw new Error("Razorpay Webhook signature verification failed.");
  }

  // Get the ID and type
  const event = typeof body === "string" ? JSON.parse(body) : body;
  const eventType = event.event;

  // CREATE
  if (eventType === "payment.captured") {
    const { order_id, amount, notes, created_at, id } =
      event.payload.payment.entity;

    const transaction = {
      amount: amount ? amount / 100 : 0,
      plan: notes?.plan || "",
      credits: Number(notes?.credits) || 0,
      buyerId: notes?.buyerId || "",
    };

    const newTransaction = await createTransaction(
      order_id,
      created_at,
      id,
      transaction
    );

    return NextResponse.json({ message: "OK", transaction: newTransaction });
  }

  return new Response("", { status: 200 });
}
