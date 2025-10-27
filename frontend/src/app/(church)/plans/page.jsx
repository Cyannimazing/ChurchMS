"use client";

import React, { useState, useEffect } from "react";
import axios from "@/lib/axios";
import Button from "@/components/Button.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import Link from "next/link";
import DataLoading from "@/components/DataLoading";

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form, setForm] = useState({
    transaction_type: "Renewal",
    payment_method: "",
  });
  const [errors, setErrors] = useState({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    setErrors({});
    try {
      const response = await axios.get("/api/subscription-plans");
      console.log("API Response:", response.data);
      if (Array.isArray(response.data)) {
        // Hide free plans from the church UI (price 0 or named "Free")
        const paidPlans = response.data.filter(p => {
          const price = Number(p?.Price ?? 0);
          const name = (p?.PlanName || '').toString().toLowerCase();
          return price > 0 && name !== 'free';
        });
        setPlans(paidPlans);
      } else {
        throw new Error("Invalid data format: Expected an array of plans");
      }
    } catch (error) {
      console.error(
        "Error fetching plans:",
        error.response?.data || error.message
      );
      setErrors({
        fetch: [
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Failed to fetch subscription plans. Please try again later.",
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    if (!selectedPlan) {
      setErrors({ plan_id: ["Please select a plan"] });
      return;
    }

    if (!agreedToTerms) {
      setErrors({ terms: ["Please accept the terms and conditions"] });
      return;
    }

    // Always handle payment through PayMongo checkout
    handleModernPayment();
  };

  const handleModernPayment = async () => {
    setIsProcessingPayment(true);
    setErrors({});
    
    try {
      const response = await axios.post("/api/church-subscriptions/payment", {
        plan_id: selectedPlan.PlanID,
      });
      
      if (response.data.success && response.data.checkout_url) {
        // Redirect to PayMongo payment page
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error('Invalid response from payment service');
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      if (error.response?.status === 422) {
        setErrors(
          error.response.data.errors || { general: ["Validation failed"] }
        );
      } else if (error.response?.status === 400 && error.response.data.error) {
        setErrors({ general: [error.response.data.error] });
      } else {
        setErrors({
          general: ["Failed to initialize payment. Please try again."],
        });
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const closePaymentModal = () => {
    setSelectedPlan(null);
    setForm({ transaction_type: "Renewal", payment_method: "" });
    setErrors({});
    setAgreedToTerms(false);
  };

  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="w-full mx-auto h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Subscription Plans
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Choose the perfect plan for your church's needs
                </p>
              </div>
              <Link href="/subscriptions">
                <Button variant="outline">
                  ← Back to Status
                </Button>
              </Link>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-start overflow-y-auto">

          {Object.keys(errors).length > 0 && !selectedPlan && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
              <p className="text-sm text-red-700">
                {errors.fetch
                  ? errors.fetch[0]
                  : Object.values(errors).flat()[0]}
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <DataLoading message="Loading subscription plans..." />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No plans available.</p>
              <Link href="/subscriptions">
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                  Return to Subscription Status
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6 max-w-4xl my-auto">
              {plans.map((plan) => (
                <div
                  key={plan.PlanID}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200 w-80 max-w-sm"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {plan.PlanName}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        ₱{plan.Price}
                      </span>
                      <span className="text-gray-600 ml-1">
                        /{plan.DurationInMonths} month{plan.DurationInMonths !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      {plan.Description || "Perfect for church management"}
                    </p>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      All components included
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Advanced dashboard access
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Support for {plan.MaxChurchesAllowed} church{plan.MaxChurchesAllowed !== 1 ? 'es' : ''}
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    aria-label={`Select ${plan.PlanName} plan`}
                  >
                    Select Plan
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Payment Modal */}
          {selectedPlan && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white shadow-xl rounded-lg max-w-md w-full">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Confirm Subscription
                    </h2>
                    <button
                      onClick={closePaymentModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6">

                {Object.keys(errors).length > 0 && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
                    <p className="text-sm text-red-700">
                      {errors.plan_id
                        ? errors.plan_id[0]
                        : errors.general
                        ? errors.general[0]
                        : Object.values(errors).flat()[0]}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label>Selected Plan</Label>
                    <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {selectedPlan.PlanName || "Unnamed Plan"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedPlan.DurationInMonths || 0} month{(selectedPlan.DurationInMonths || 0) !== 1 ? "s" : ""} subscription
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            ₱{selectedPlan.Price || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="font-medium text-blue-800">Payment Methods Available</p>
                    </div>
                    <p className="text-sm text-blue-700">You can pay using GCash, Credit/Debit Cards (Visa, Mastercard), or other available payment methods on the secure checkout page.</p>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="space-y-3">
                      <h3 className="font-medium text-amber-800">Before You Continue</h3>
                      <p className="text-sm text-amber-700">
                        Once paid or availed, your subscription cannot be cancelled for the current term. Please review our full Terms & Agreement before proceeding.
                      </p>
                      <div className="flex items-start justify-between gap-4 pt-2">
                        <div className="flex items-start gap-3">
                          <input
                            id="agree-terms"
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="agree-terms" className="text-sm text-amber-800">
                            I have read and agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="underline font-medium hover:text-amber-900">Terms & Agreement</button>.
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="button"
                      onClick={closePaymentModal}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isProcessingPayment || !agreedToTerms}
                    >
                      {isProcessingPayment
                        ? 'Redirecting to payment...'
                        : 'Confirm Subscription'
                      }
                    </Button>
                  </div>
                </form>
                </div>
              </div>
            </div>
          )}

          {/* Terms & Agreement Modal */}
          {showTermsModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white shadow-xl rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">FaithSeeker Subscription Terms & Agreement</h2>
                  <button onClick={() => setShowTermsModal(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                  <section>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">1) Overview</h3>
                    <p className="text-sm text-gray-600">This agreement governs your purchase and use of a FaithSeeker subscription. By proceeding, you confirm that you have read and agree to these terms.</p>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">2) Payment & Activation</h3>
                    <p className="text-sm text-gray-600">Upon successful payment, your subscription is activated (or scheduled to start after your current plan ends, if applicable). A receipt will be provided on the success page.</p>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">3) No Cancellation After Payment</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                      <li>Once payment is completed or the subscription is availed, the current term cannot be cancelled.</li>
                      <li>No proration or partial credits apply for unused time in the current term.</li>
                      <li>Changes take effect in the next billing cycle (upon renewal).</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">4) Service Access</h3>
                    <p className="text-sm text-gray-600">You will receive access according to the plan purchased. FaithSeeker may perform maintenance from time to time with minimal disruption.</p>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">5) Support</h3>
                    <p className="text-sm text-gray-600">For any concerns regarding your purchase, contact support. We will assist you with subscription status and account issues.</p>
                  </section>
                </div>

                <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowTermsModal(false)}>Close</Button>
                  <Button onClick={() => { setAgreedToTerms(true); setShowTermsModal(false); }}>I Agree</Button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
