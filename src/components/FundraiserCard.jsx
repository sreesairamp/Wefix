import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import StripePayment from "./StripePayment";

export default function FundraiserCard({ fundraiser, groupLeaderId, onDonateSuccess }) {
  const { user } = useAuth();
  const [donationAmount, setDonationAmount] = useState("");
  const [showDonateForm, setShowDonateForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [invoices, setInvoices] = useState([]);

  const progress = (fundraiser.current_amount / fundraiser.target_amount) * 100;

  const handlePaymentSuccess = async (paymentData) => {
    setProcessing(true);

    try {
      // Create donation record with payment info
      const donationData = {
        fundraiser_id: fundraiser.id,
        donor_user_id: user?.id || null,
        donor_name: paymentData.donorName,
        donor_email: paymentData.donorEmail,
        amount: paymentData.amount,
        payment_status: "completed",
        payment_date: new Date().toISOString(),
        payment_method: "card",
        transaction_id: paymentData.paymentMethodId,
        // Funds go to group leader
        recipient_user_id: groupLeaderId,
      };

      const { data: donation, error: donationError } = await supabase
        .from("donations")
        .insert([donationData])
        .select()
        .single();

      if (donationError) {
        console.error("Error creating donation:", donationError);
        alert("Failed to process donation");
        return;
      }

      // Update fundraiser current amount
      const newAmount = (fundraiser.current_amount || 0) + paymentData.amount;
      await supabase
        .from("fundraisers")
        .update({ current_amount: newAmount })
        .eq("id", fundraiser.id);

      // Generate invoice
      const invoiceNumber = `INV-${Date.now()}-${donation.id.substring(0, 8).toUpperCase()}`;
      
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert([
          {
            donation_id: donation.id,
            fundraiser_id: fundraiser.id,
            invoice_number: invoiceNumber,
            donor_name: paymentData.donorName,
            donor_email: paymentData.donorEmail,
            amount: paymentData.amount,
            issue_date: new Date().toISOString(),
            status: "paid",
          },
        ])
        .select()
        .single();

      if (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
      } else {
        setInvoices((prev) => [...prev, invoice]);
      }

      alert(`Thank you for your donation! Invoice #${invoiceNumber} has been generated. Funds will be transferred to the group leader.`);
      
      // Reset form
      setDonationAmount("");
      setShowDonateForm(false);
      setShowPaymentForm(false);
      
      onDonateSuccess();
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Failed to process donation");
    } finally {
      setProcessing(false);
    }
  };

  const downloadInvoice = (invoice) => {
    // Generate invoice PDF content
    const invoiceContent = `
INVOICE

Invoice Number: ${invoice.invoice_number}
Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}
Status: ${invoice.status}

FROM:
WeFix Community Platform

TO:
${invoice.donor_name}
${invoice.donor_email}

DONATION DETAILS:
Fundraiser: ${fundraiser.title}
Amount: $${invoice.amount.toFixed(2)}
Payment Date: ${new Date(invoice.issue_date).toLocaleDateString()}

Thank you for your contribution!
`;

    // Create and download invoice as text file
    const blob = new Blob([invoiceContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoice.invoice_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gradient-to-br from-white to-purple-50/30 p-6 rounded-2xl shadow-xl border-l-4 border-purple-500 hover:shadow-2xl transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800">{fundraiser.title}</h3>
          {fundraiser.description && (
            <p className="text-gray-600 mt-1">{fundraiser.description}</p>
          )}
        </div>
        <span className={`px-3 py-1 rounded text-sm font-semibold ${
          fundraiser.status === "active" 
            ? "bg-green-100 text-green-700" 
            : "bg-gray-100 text-gray-700"
        }`}>
          {fundraiser.status}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Raised: ${fundraiser.current_amount?.toFixed(2) || "0.00"}</span>
          <span>Goal: ${fundraiser.target_amount.toFixed(2)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-4 rounded-full transition-all duration-500 shadow-lg"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {progress.toFixed(1)}% of goal reached
        </p>
      </div>

      {/* Donate Button */}
      {!showDonateForm && !showPaymentForm ? (
        <button
          onClick={() => setShowDonateForm(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold shadow-lg transition-transform hover:scale-105"
        >
          💰 Donate Now
        </button>
      ) : showDonateForm && !showPaymentForm ? (
        <div className="space-y-3">
          <input
            type="number"
            value={donationAmount}
            onChange={(e) => setDonationAmount(e.target.value)}
            placeholder="Amount ($)"
            min="1"
            step="0.01"
            className="w-full border-2 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (donationAmount && parseFloat(donationAmount) > 0) {
                  setShowPaymentForm(true);
                } else {
                  alert("Please enter a valid donation amount");
                }
              }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold shadow-md transition-transform hover:scale-105"
            >
              Continue to Payment
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDonateForm(false);
                setDonationAmount("");
              }}
              className="px-4 py-2 border-2 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-purple-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-blue-50">
          <StripePayment
            amount={parseFloat(donationAmount)}
            fundraiserId={fundraiser.id}
            groupLeaderId={groupLeaderId}
            onSuccess={handlePaymentSuccess}
            onCancel={() => {
              setShowPaymentForm(false);
              setShowDonateForm(false);
              setDonationAmount("");
            }}
          />
        </div>
      )}

      {/* Recent Invoices for this fundraiser (if user donated) */}
      {invoices.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">Your Invoices</h4>
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex justify-between items-center text-sm">
                <span>{invoice.invoice_number}</span>
                <button
                  onClick={() => downloadInvoice(invoice)}
                  className="text-purple-600 hover:underline"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

