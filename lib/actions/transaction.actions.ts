"use server";

import { redirect } from "next/navigation";
import Razorpay from "razorpay";
import { handleError } from "../utils";
import { connectToDatabase } from "../database/mongoose";
import Transaction from "../database/models/transaction.model";
import { updateCredits } from "./user.actions";

const {
  validatePaymentVerification,
} = require("razorpay/dist/utils/razorpay-utils");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Define types for transactions if you haven't already
interface CheckoutTransactionParams {
  amount: number;
  plan: string;
  credits: number;
  buyerId: string;
}

interface CreateTransactionParams {
  amount: number;
  plan: string;
  credits: number;
  buyerId: string;
}

export async function checkoutCredits(transaction: CheckoutTransactionParams) {
  const amount = transaction.amount * 100; // Razorpay expects amount in the smallest currency unit (paise for INR)
  try {
    // Create a Razorpay order
    const order = await razorpay.orders.create({
      amount,
      receipt: `receipt_${transaction.buyerId}`,
      currency: "INR", // or USD based on your requirement

      notes: {
        plan: transaction.plan,
        credits: transaction.credits.toString(),
        buyerId: transaction.buyerId,
      },
    });

    // Return the order details to be used in the frontend
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  } catch (error) {
    handleError(error);
  }
}

export async function createTransaction(
  transaction: CreateTransactionParams,
  razorpaySignatureParams: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }
) {
  try {
    await connectToDatabase();

    const isSignatureValid = validatePaymentVerification(
      {
        order_id: razorpaySignatureParams.razorpay_order_id,
        payment_id: razorpaySignatureParams.razorpay_payment_id,
      },
      razorpaySignatureParams.razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET
    );

    if (!isSignatureValid) {
      throw new Error("Razorpay signature verification failed.");
    }

    // Create a new transaction with a buyerId
    const newTransaction = await Transaction.create({
      ...transaction,
      buyer: transaction.buyerId,
    });

    await updateCredits(transaction.buyerId, transaction.credits);

    return JSON.parse(JSON.stringify(newTransaction));
  } catch (error) {
    handleError(error);
  }
}
