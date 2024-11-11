"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { checkoutCredits } from "@/lib/actions/transaction.actions"; // Your backend action to create Razorpay order

import { Button } from "../ui/button";

const Checkout = ({
  plan,
  amount,
  credits,
  buyerId,
}: {
  plan: string;
  amount: number;
  credits: number;
  buyerId: string;
}) => {
  const { toast } = useToast();

  useEffect(() => {
    const loadRazorpayScript = () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true; // Ensure it loads asynchronously
      script.onload = () => {
        console.log("Razorpay script loaded");
      };
      document.body.appendChild(script);
    };

    loadRazorpayScript();
  }, []);

  const onCheckout = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    const transaction = {
      plan,
      amount,
      credits,
      buyerId,
    };

    try {
      // Create an order on the backend
      const response = await checkoutCredits(transaction); // Should return { id: orderId, amount, currency }
      if (!response) {
        toast({
          title: "Order failed",
          description: "Unable to create Razorpay order. Try again",
          duration: 3000,
          className: "error-toast",
        });
        return;
      }

      const { id: order_id, amount, currency } = response;

      // Check if Razorpay script is loaded
      if (typeof window.Razorpay === "undefined") {
        toast({
          title: "Error",
          description: "Razorpay SDK failed to load. Are you online?",
          duration: 3000,
          className: "error-toast",
        });
        return;
      }

      // Configure Razorpay options
      const options = {
        key_id: process.env.TEST_RAZORPAY_KEY_ID,
        amount: amount.toString(),
        currency,
        name: "Pixalair",
        description: plan,
        order_id,
        // prefill: {
        //   //We recommend using the prefill parameter to auto-fill customer's contact information especially their phone number
        //   name: "", //your customer's name
        //   email: "",
        //   contact: "", //Provide the customer's phone number for better conversion rates
        // },
        // readonly: { email: true, contact: true },
        handler: function (response: any) {
          console.log(response);
          toast({
            title: "Order placed!",
            description: "Your payment was successful!",
            duration: 1000,
            className: "success-toast",
          });
          window.location.href = `${process.env.NEXT_PUBLIC_SERVER_URL}/profile`;
        },
        theme: { color: "#3399cc" },
      };

      // Open the Razorpay checkout modal
      var rzp = new Razorpay(options);
      rzp.open();
      e.preventDefault();

      rzp.on("payment.failed", function (response: any) {
        console.error(response.error);
      });
    } catch (error) {
      toast({
        title: "Order failed",
        description: "Unable to create Razorpay order. Try again.",
        duration: 3000,
        className: "error-toast",
      });
      console.error(error);
    }
  };

  return (
    <section>
      <Button
        type="button"
        onClick={(event) => onCheckout(event)}
        className="w-full rounded-full bg-purple-gradient bg-cover"
      >
        Buy Credit
      </Button>
    </section>
  );
};

export default Checkout;
