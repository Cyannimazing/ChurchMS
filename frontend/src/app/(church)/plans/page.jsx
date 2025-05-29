"use client";

import axios from "@/lib/axios";
import Button from "@/components/Button.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import Link from "next/link";
import { useState, useEffect } from "react";
import DataLoading from "@/components/DataLoading";
import PlanCard from "@/components/PlanCard";

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
      await axios.get("/sanctum/csrf-cookie");
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
                  className="flex justify-center items-center min-h-[300px]"
                >
                  <div className="w-full max-w-sm">
                    <PlanCard
                      plan={plan}
                      isSelected={selectedPlan?.PlanID === plan.PlanID}
                      onSelect={() => setSelectedPlan(plan)}
                    />
                  </div>
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
