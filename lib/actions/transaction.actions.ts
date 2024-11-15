"use server";

import { redirect } from "next/navigation";
import Razorpay from "razorpay";
import { handleError } from "../utils";
import { connectToDatabase } from "../database/mongoose";
import Transaction from "../database/models/transaction.model";
import { updateCredits } from "./user.actions";
import Order from "../database/models/orderRazorpay.model";

const {
  validatePaymentVerification,
} = require("razorpay/dist/utils/razorpay-utils");

const razorpay = new Razorpay({
  key_id: process.env.TEST_RAZORPAY_KEY_ID as string,
  key_secret: process.env.TEST_RAZORPAY_KEY_SECRET,
});

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

    if (order) {
      const savedOrder = await Order.create({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        buyerId: transaction.buyerId,
      });
    }

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

export async function updateOrderAndVerifyPaymentSignature(
  order_id: string,
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
) {
  try {
    const isSignatureValid = validatePaymentVerification(
      {
        order_id: order_id,
        payment_id: razorpay_payment_id,
      },
      razorpay_signature,
      process.env.TEST_RAZORPAY_KEY_SECRET
    );

    if (!isSignatureValid) {
      throw new Error("Razorpay signature verification failed.");
    }

    await connectToDatabase();

    // Find the order by ID and update it with Razorpay details
    await Order.findOneAndUpdate(
      { order_id: order_id },
      {
        $set: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        },
      }
    );
  } catch (error) {
    console.error("Error updating order:", error);
    throw new Error("Failed to update order");
  }
}

// const waitForPaymentId = async (
//   order_id: string,
//   maxWaitTime: number = 15000,
//   interval: number = 500
// ) => {
//   const startTime = Date.now();

//   while (Date.now() - startTime < maxWaitTime) {
//     const order = await Order.findOne({ order_id: order_id });
//     if (!order) {
//       throw new Error("Order not found");
//     }
//     if (order.razorpay_payment_id) {
//       return order;
//     }
//     await new Promise((resolve) => setTimeout(resolve, interval));
//   }
// };

export async function createTransaction(
  order_id: string,
  created_at: Date,
  razorpayId: string,
  transaction: CheckoutTransactionParams
) {
  try {
    await connectToDatabase();

    console.log("razorpayID:" + razorpayId);
    if (!razorpayId) {
      throw new Error("razorpayId is required but is null or undefined.");
    }
    const newTransaction = await Transaction.findOneAndUpdate(
      { razorpayId },
      {
        order_id,
        amount: transaction.amount,
        plan: transaction.plan,
        credits: transaction.credits,
        buyerId: transaction.buyerId,
        created_at,
      },
      { upsert: true, new: true } // Create if not exists
    );

    await updateCredits(transaction.buyerId, transaction.credits);

    return JSON.parse(JSON.stringify(newTransaction));
  } catch (error) {
    handleError(error);
  }
}
