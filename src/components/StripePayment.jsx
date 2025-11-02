import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripeConfig } from "../utils/stripeConfig";

const stripePromise = loadStripe(stripeConfig.publishableKey);

function CheckoutForm({ amount, fundraiserId, groupLeaderId, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent on your backend
      // For demo purposes, we'll create it client-side (NOT recommended for production)
      // In production, create a backend endpoint that creates the payment intent
      
      const cardElement = elements.getElement(CardElement);
      
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: donorName || "Anonymous",
          email: donorEmail || "",
        },
      });

      if (pmError) {
        setError(pmError.message);
        setProcessing(false);
        return;
      }

      // Here you would normally call your backend API to:
      // 1. Create a payment intent
      // 2. Confirm the payment
      // 3. Store the donation in your database
      
      // For demo, we'll simulate success
      // IMPORTANT: In production, never handle payments client-side only!
      
      // In production, you would call your backend API here:
      // const response = await fetch('/api/create-payment-intent', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount, paymentMethodId: paymentMethod.id })
      // });
      // const { clientSecret } = await response.json();
      // const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);
      
      // NOTE: In production, you MUST call your backend API to:
      // 1. Create a payment intent with the amount
      // 2. Confirm the payment using the client secret
      // 3. Handle webhooks for final confirmation
      
      // For demo/testing purposes only:
      // Since we don't have a backend, we'll simulate payment success
      // This is NOT secure for production - payments MUST be handled server-side!
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call onSuccess with payment details
      onSuccess({
        paymentMethodId: paymentMethod.id,
        amount: amount,
        fundraiserId: fundraiserId,
        groupLeaderId: groupLeaderId,
        donorName: donorName || "Anonymous",
        donorEmail: donorEmail || "",
      });
      setProcessing(false);

    } catch (err) {
      console.error("Payment error:", err);
      setError("Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name (Optional)
        </label>
        <input
          type="text"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          placeholder="Your name"
          className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email (Optional)
        </label>
        <input
          type="email"
          value={donorEmail}
          onChange={(e) => setDonorEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white p-4 border rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#9e2146",
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={processing || !stripe}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 shadow-lg transition-transform hover:scale-105"
        >
          {processing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function StripePayment({ amount, fundraiserId, groupLeaderId, onSuccess, onCancel }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        amount={amount}
        fundraiserId={fundraiserId}
        groupLeaderId={groupLeaderId}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}

