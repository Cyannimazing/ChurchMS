"use client";

import React, { useState, useEffect } from "react";
import axios from "@/lib/axios";
import DataLoading from "@/components/DataLoading";
import Button from "../Button";

const PricingSection = ({ onPlanSelect }) => {
  const [plans, setPlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [errors, setErrors] = useState({ plans: [] });

  const fetchSubscriptionPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const response = await axios.get("/api/subscription-plans");
      console.log("Fetched subscription plans:", response.data);
      if (Array.isArray(response.data)) {
        setPlans(response.data);
      } else {
        throw new Error("Invalid data format: Expected an array of plans");
      }
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
    fetchSubscriptionPlans();
  }, []);

  return (
    <>
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl text-gray-900">
            Simple, Transparent <span className="text-indigo-600">Pricing</span>
          </h1>
          <p className="text-lg text-gray-600 lg:text-xl max-w-3xl mx-auto">
            Select your plan and empower your church with seamless service management.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {isLoadingPlans ? (
          <div className="flex justify-center py-12">
            <DataLoading message="Loading plans..." />
          </div>
        ) : errors.plans.length > 0 ? (
          <div className="flex justify-center py-12">
            <p className="text-center text-red-500 text-lg">
              {errors.plans[0]}
            </p>
          </div>
        ) : plans.length === 0 ? (
          <div className="flex justify-center py-12">
            <p className="text-center text-gray-500 text-lg">
              No plans available.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-8">
            {plans.map((plan) => (
            <div
              key={plan.PlanID}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-gray-200 hover:border-indigo-500 w-full max-w-sm"
            >
              <div className="flex items-baseline justify-center text-gray-900 mb-3 sm:mb-4">
                <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                  ₱{plan.Price}
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
              <ul role="list" className="space-y-3 sm:space-y-4 my-5 sm:my-6">
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
                onClick={() => {
                  window.location.href = '/register';
                }}
              >
                Get Started
              </Button>
            </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PricingSection;
