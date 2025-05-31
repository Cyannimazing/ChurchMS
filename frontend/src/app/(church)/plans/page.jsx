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
    <div className="min-h-screen px-4 sm:px-6 lg:ml-75 lg:py-12 mx-3 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-sm rounded-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
              Subscription Plans
            </h1>
            <Link href="/subscriptions" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md"
              >
                ← Back to Status
              </Button>
            </Link>
          </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {plans.map((plan) => (
                <div
                  key={plan.PlanID}
                  className="w-full p-4 sm:p-5 md:p-6 bg-gradient-to-br from-white to-gray-50 border border-black rounded-2xl shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-baseline justify-center text-gray-900 mb-3 sm:mb-4">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                      ${plan.Price}
                    </span>
                    <span className="ml-1 text-sm sm:text-base md:text-lg font-normal text-gray-600">
                      /{plan.DurationInMonths} month
                      {plan.DurationInMonths !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <h5 className="mb-2 text-base sm:text-lg md:text-xl font-bold text-gray-900 text-center">
                    {plan.PlanName}
                  </h5>
                  <p className="mb-4 sm:mb-5 text-sm sm:text-base text-gray-600 text-center">
                    {plan.Description || "Test plan for church owners"}
                  </p>
                  <ul
                    role="list"
                    className="space-y-3 sm:space-y-4 my-5 sm:my-6"
                  >
                    <li className="flex items-center">
                      <svg
                        className="shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-green-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                      </svg>
                      <span className="text-sm sm:text-base font-normal leading-tight text-gray-900 ml-2 sm:ml-3">
                        All components included
                      </span>
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-green-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                      </svg>
                      <span className="text-sm sm:text-base font-normal leading-tight text-gray-900 ml-2 sm:ml-3">
                        Advanced dashboard
                      </span>
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-green-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                      </svg>
                      <span className="text-sm sm:text-base font-normal leading-tight text-gray-900 ml-2 sm:ml-3">
                        Max Churches Supported: {plan.MaxChurchesAllowed}
                      </span>
                    </li>
                  </ul>
                  <Button
                  className="w-full"
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    variant="primary"
                    aria-label={`Select ${plan.PlanName} plan`}
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Payment Modal */}
          {selectedPlan && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white shadow-xl rounded-xl p-6 sm:p-8 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Subscription Details
                  </h2>
                  <button
                    onClick={closePaymentModal}
                    className="text-gray-500 hover:text-gray-700 font-medium"
                  >
                    ✕ Close
                  </button>
                </div>

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
                    <div className="mt-2 p-4 bg-gray-50 border rounded-md">
                      <p className="font-medium text-gray-900">
                        {selectedPlan.PlanName || "Unnamed Plan"}
                      </p>
                      <p className="text-sm text-gray-600">
                        ${selectedPlan.Price || 0} for{" "}
                        {selectedPlan.DurationInMonths || 0} month
                        {(selectedPlan.DurationInMonths || 0) !== 1 ? "s" : ""}
                      </p>
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
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 p-3"
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

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition-colors"
                  >
                    Confirm Subscription
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
