"use client";

import { useAuth } from "@/hooks/auth";
import axios from "@/lib/axios";
import Button from "@/components/Button.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import Link from "next/link";
import { useState, useEffect } from "react";

const SubscriptionPlans = () => {
  const { user } = useAuth({ middleware: "auth" });
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form, setForm] = useState({
    transaction_type: "Renewal",
    payment_method: "",
  });
  const [errors, setErrors] = useState({});

  const fetchPlans = async () => {
    try {
      const response = await axios.get("/api/subscription-plans");
      setPlans(response.data);
    } catch (error) {
      console.error("Error fetching plans:", error);
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
        window.location.href = "/subscriptions"; // Redirect to status page
      })
      .catch((error) => {
        if (error.response?.status === 422) {
          setErrors(error.response.data.errors);
        } else if (
          error.response?.status === 400 &&
          error.response.data.error
        ) {
          alert(error.response.data.error);
        } else {
          console.error("Error applying subscription:", error);
        }
      });
  };

  if (user?.profile?.system_role_id !== 2) {
    return <div className="py-12 text-center">Unauthorized</div>;
  }

  if (loading) {
    return (
      <div className="lg:ml-75 mx-3 py-12 text-center text-lg font-medium">
        Loading subscription plans...
      </div>
    );
  }

  return (
    <div className="py-12 lg:ml-75 mx-3">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-center mb-6">
              <Link href="/subscriptions" className="mr-4">
                <Button variant="secondary">← Back to Status</Button>
              </Link>
              <h2 className="text-lg font-semibold">
                Available Subscription Plans
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.PlanID}
                  className={`border rounded-lg p-6 cursor-pointer transition-all ${
                    selectedPlan?.PlanID === plan.PlanID
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <h3 className="text-xl font-bold">{plan.PlanName}</h3>
                  <p className="text-2xl font-semibold my-2">
                    ${plan.Price}
                    <span className="text-sm text-gray-500 ml-1">
                      / {plan.DurationInMonths} months
                    </span>
                  </p>
                  <p className="text-gray-600">{plan.Description}</p>
                </div>
              ))}
            </div>

            {selectedPlan && (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4 max-w-md">
                <div>
                  <Label>Selected Plan</Label>
                  <div className="p-3 bg-gray-50 rounded border">
                    <p className="font-medium">{selectedPlan.PlanName}</p>
                    <p className="text-sm text-gray-600">
                      ${selectedPlan.Price} for {selectedPlan.DurationInMonths}{" "}
                      months
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
                    className="block mt-1 w-full border rounded p-2"
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

                <Button type="submit" className="w-full">
                  Confirm Subscription
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
