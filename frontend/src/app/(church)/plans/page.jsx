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

  const fetchPlans = async () => {
    setLoading(true);
    setErrors({});
    try {
      const response = await axios.get("/api/subscription-plans");
      console.log("API Response:", response.data);
      if (Array.isArray(response.data)) {
        setPlans(response.data);
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

    axios
      .post("/api/church-subscriptions", {
        ...form,
        plan_id: selectedPlan.PlanID,
      })
      .then(() => {
        window.location.href = "/subscriptions";
      })
      .catch((error) => {
        if (error.response?.status === 422) {
          setErrors(
            error.response.data.errors || { general: ["Validation failed"] }
          );
        } else if (
          error.response?.status === 400 &&
          error.response.data.error
        ) {
          setErrors({ general: [error.response.data.error] });
        } else {
          console.error("Error applying subscription:", error);
          setErrors({
            general: ["An unexpected error occurred. Please try again."],
          });
        }
      });
  };

  const closePaymentModal = () => {
    setSelectedPlan(null);
    setForm({ transaction_type: "Renewal", payment_method: "" });
    setErrors({});
  };

  return (
    <div className="lg:p-6 w-full pt-20">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
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
          <div className="p-6">

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.PlanID}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {plan.PlanName}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        ${plan.Price}
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
                            ${selectedPlan.Price || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <select
                      id="payment_method"
                      value={form.payment_method}
                      onChange={(e) =>
                        setForm({ ...form, payment_method: e.target.value })
                      }
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 p-3"
                    >
                      <option value="">Select Payment Method</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                    <InputError
                      messages={errors.payment_method}
                      className="mt-2"
                    />
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
                    >
                      Confirm Subscription
                    </Button>
                  </div>
                </form>
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
