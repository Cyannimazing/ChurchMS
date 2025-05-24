"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/auth";
import axios from "@/lib/axios";

const Page = () => {
  const { register } = useAuth({
    middleware: "guest",
    redirectIfAuthenticated: "/dashboard",
  });

  const [step, setStep] = useState(1);
  const [roleId, setRoleId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirmation: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    address: "",
    contact_number: "",
  });
  const [errors, setErrors] = useState({});

  const fetchSubscriptionPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const response = await axios.get("/api/subscription-plans");
      console.log("Fetched subscription plans:", response.data);
      setPlans(response.data);
    } catch (error) {
      console.error("Error fetching plans:", error);
      setErrors((prev) => ({
        ...prev,
        plans: [
          error.response?.data?.message ||
            "Failed to load subscription plans. Please try again.",
        ],
      }));
    } finally {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    if (roleId === "2" && step === 2) {
      fetchSubscriptionPlans();
    }
  }, [roleId, step]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    const requestData = {
      ...formData,
      role_id: roleId,
      subscription_plan_id: selectedPlan,
    };
    try {
      await register({
        ...requestData,
        setErrors,
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response?.data?.errors) {
        console.log("Validation errors:", error.response.data.errors);
        setErrors(error.response.data.errors);
      } else {
        console.log("Unexpected error:", error.response?.data || error.message);
      }
    }
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-lg w-full mx-4 p-8 bg-white rounded-2xl shadow-lg">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
            Choose Your Role
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div
              className={`p-6 rounded-xl border-2 cursor-pointer ${
                roleId === "1"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 hover:bg-indigo-50"
              }`}
              onClick={() => setRoleId("1")}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Seeker
              </h3>
              <p className="text-gray-600">
                Find and connect with churches in your area
              </p>
            </div>
            <div
              className={`p-6 rounded-xl border-2 cursor-pointer ${
                roleId === "2"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 hover:bg-indigo-50"
              }`}
              onClick={() => setRoleId("2")}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Church Owner
              </h3>
              <p className="text-gray-600">
                Manage your church's online presence
              </p>
            </div>
          </div>
          {errors.role_id && (
            <div className="text-red-600 text-sm mt-4 text-center">
              {errors.role_id[0]}
            </div>
          )}
          <div className="mt-8 flex justify-end">
            <button
              onClick={nextStep}
              disabled={!roleId}
              className={`px-6 py-2 rounded-lg font-semibold text-white ${
                roleId
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2 && roleId === "2") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-3xl w-full mx-4 p-6 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
            Choose Your Plan
          </h2>
          {isLoadingPlans ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
            </div>
          ) : errors.plans ? (
            <div className="text-red-600 text-center py-4 text-lg">
              {errors.plans[0]}
            </div>
          ) : (
            <div className="flex flex-row justify-center gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.PlanID}
                  className={`p-4 w-64 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer ${
                    selectedPlan === plan.PlanID ? "border-indigo-500" : ""
                  }`}
                  onClick={() => handlePlanSelect(plan.PlanID)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                    {plan.PlanName}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mb-1 text-center">
                    ${plan.Price}/
                    <span className="text-sm font-normal text-gray-600">
                      month
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mb-3 text-center">
                    Test plan for church owners
                  </p>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p className="text-center">
                      Duration: {plan.DurationInMonths} months
                    </p>
                    <p className="text-center">
                      Max Churches: {plan.MaxChurchesAllowed}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={prevStep}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={selectedPlan === null}
              className={`px-4 py-2 rounded-lg font-semibold text-white ${
                selectedPlan !== null
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === (roleId === "2" ? 3 : 2)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-lg w-full mx-4 p-8 bg-white rounded-2xl shadow-lg">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
            Personal Information
          </h2>
          <div className="space-y-6">
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="block w-full mt-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 p-3"
              />
              {errors.first_name && (
                <div className="text-red-600 text-sm mt-2">
                  {errors.first_name[0]}
                </div>
              )}
            </div>
            <div>
              <label
                htmlFor="middle_name"
                className="block text-sm font-medium text-gray-700"
              >
                Middle Initial
              </label>
              <input
                id="middle_name"
                name="middle_name"
                type="text"
                maxLength={1}
                value={formData.middle_name}
                onChange={handleChange}
                className="block w-full mt-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 p-3"
              />
              {errors.middle_name && (
                <div className="text-red-600 text-sm mt-2">
                  {errors.middle_name[0]}
                </div>
              )}
            </div>
            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="block w-full mt-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 p-3"
              />
              {errors.last_name && (
                <div className="text-red-600 text-sm mt-2">
                  {errors.last_name[0]}
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <button
              onClick={prevStep}
              className="px-6 py-2 rounded-lg border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={!formData.first_name || !formData.last_name}
              className={`px-6 py-2 rounded-lg font-semibold text-white ${
                formData.first_name && formData.last_name
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === (roleId === "2" ? 4 : 3)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-lg w-full mx-4 p-8 bg-white rounded-2xl shadow-lg">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
            Contact Information
          </h2>
          <div className="space-y-6">
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700"
              >
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="block w-full mt-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 p-3 min-h-[120px]"
                required
              />
              {errors.address && (
                <div className="text-red-600 text-sm mt-2">
                  {errors.address[0]}
                </div>
              )}
            </div>
            <div>
              <label
                htmlFor="contact_number"
                className="block text-sm font-medium text-gray-700"
              >
                Contact Number
              </label>
              <input
                id="contact_number"
                name="contact_number"
                type="tel"
                value={formData.contact_number}
                onChange={handleChange}
                required
                className="block w-full mt-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 p-3"
              />
              {errors.contact_number && (
                <div className="text-red-600 text-sm mt-2">
                  {errors.contact_number[0]}
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <button
              onClick={prevStep}
              className="px-6 py-2 rounded-lg border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={!formData.address || !formData.contact_number}
              className={`px-6 py-2 rounded-lg font-semibold text-white ${
                formData.address && formData.contact_number
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === (roleId === "2" ? 5 : 4)) {
    const passwordsMatch = formData.password === formData.password_confirmation;
    const isFormValid =
      formData.email &&
      formData.password &&
      formData.password_confirmation &&
      passwordsMatch;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-lg w-full mx-4 p-8 bg-white rounded-2xl shadow-lg">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
            Create Account
          </h2>
          <form onSubmit={submitForm} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="block w-full mt-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 p-3"
              />
              {errors.email && (
                <div className="text-red-600 text-sm mt-2">
                  {errors.email[0]}
                </div>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="block w-full mt-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 p-3"
                autoComplete="new-password"
              />
              {formData.password.length < 8 && formData.password && (
                <div className="text-red-600 text-sm mt-2">
                  Password must be at least 8 characters long
                </div>
              )}
              {errors.password && (
                <div className="text-red-600 text-sm mt-2">
                  {errors.password[0]}
                </div>
              )}
            </div>
            <div>
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
                className="block w-full mt-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 p-3"
              />
              {!passwordsMatch && formData.password_confirmation && (
                <div className="text-red-600 text-sm mt-2">
                  Passwords do not match
                </div>
              )}
              {errors.password_confirmation && (
                <div className="text-red-600 text-sm mt-2">
                  {errors.password_confirmation[0]}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={prevStep}
                type="button"
                className="px-6 py-2 rounded-lg border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>
              <button
                type="submit"
                className={`px-6 py-2 rounded-lg font-semibold text-white ${
                  isFormValid
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                disabled={!isFormValid}
              >
                Complete Registration
              </button>
            </div>
            <div className="text-center mt-6">
              <Link
                href="/login"
                className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Already have an account? Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default Page;
