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
      <section className="py-18 sm:py-20 md:py-22 lg:py-24 bg-gray-100">
        <div className="max-w-screen-xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="mb-3 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-none tracking-tight text-gray-900">
            Unlock Full Features
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 px-4 sm:px-8 md:px-12 lg:px-16">
            Select your plan and empower your church with seamless service
            management.
          </p>
        </div>
      </section>

      <div className="flex flex-row flex-wrap justify-center items-start gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoadingPlans ? (
          <DataLoading message="Loading plans..." />
        ) : errors.plans.length > 0 ? (
          <p className="text-center text-red-500 text-sm sm:text-base md:text-lg">
            {errors.plans[0]}
          </p>
        ) : plans.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">
            No plans available.
          </p>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.PlanID}
              className="w-full sm:w-72 md:w-80 lg:w-96 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-white to-gray-50 border border-black rounded-2xl shadow-md hover:shadow-lg transition-all duration-300"
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
          ))
        )}
      </div>
    </>
  );
};

export default PricingSection;
