"use client";

import { useAuth } from "@/hooks/auth";
import axios from "@/lib/axios";
import Button from "@/components/Button.jsx";
import Link from "next/link";
import { useState, useEffect } from "react";
import DataLoading from "@/components/DataLoading";

const SubscriptionStatus = () => {
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);

  const getWarningMessage = () => {
    if (!currentSub?.active) return null;

    const now = new Date();
    const endDate = new Date(currentSub.active.EndDate);
    const diffMs = endDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return "Your subscription has expired.";
    }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays === 0 && diffHours === 0 && diffMinutes === 0) {
      return "Your subscription will expire in less than a minute. Please renew soon.";
    }

    if (diffDays <= 7) {
      return `Your subscription will expire in ${diffDays} day${
        diffDays !== 1 ? "s" : ""
      }, ${diffHours} hour${
        diffHours !== 1 ? "s" : ""
      }, and ${diffMinutes} minute${
        diffMinutes !== 1 ? "s" : ""
      }. Please renew soon.`;
    }

    return null;
  };

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      await axios.get("/sanctum/csrf-cookie");
      const response = await axios.get("/api/church-subscriptions");
      console.log("Fetched subscription:", response.data);
      setCurrentSub(response.data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      setCurrentSub({ active: null, pending: null }); // Fallback to avoid undefined errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleCancelPending = () => {
    axios
      .delete("/api/church-subscriptions/pending")
      .then(() => {
        setCurrentSub({ ...currentSub, pending: null });
      })
      .catch((error) =>
        console.error("Error canceling pending subscription:", error)
      );
  };

  return (
    <div className="lg:p-6 w-full pt-20">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Subscription Management
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your current subscription and view subscription history
                </p>
              </div>
              <Link href="/plans">
                <Button>Apply New Subscription</Button>
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div>
              {loading ? (
                <DataLoading message="Loading your subscription status..." />
              ) : currentSub?.active ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-lg font-medium text-green-900">Active Subscription</h3>
                      <div className="mt-2 text-sm text-green-800">
                        <p className="mb-2">
                          <span className="font-medium">Plan:</span>{" "}
                          <span className="font-semibold">{currentSub.active.plan?.PlanName ?? "N/A"}</span>
                        </p>
                        <p className="mb-2">
                          <span className="font-medium">Expires:</span>{" "}
                          {new Date(currentSub.active.EndDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {getWarningMessage() && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-yellow-800 text-sm font-medium">{getWarningMessage()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-red-900">No Active Subscription</h3>
                      <p className="mt-1 text-sm text-red-800">
                        You currently don't have an active subscription. Please subscribe to access all dashboard features.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentSub?.pending && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-lg font-medium text-yellow-900">Pending Subscription</h3>
                      <div className="mt-2 text-sm text-yellow-800">
                        <p className="mb-2">
                          <span className="font-medium">Plan:</span>{" "}
                          <span className="font-semibold">{currentSub.pending.plan?.PlanName ?? "N/A"}</span>
                        </p>
                        <p className="mb-3">
                          <span className="font-medium">Starts:</span>{" "}
                          {currentSub.pending?.StartDate
                            ? new Date(currentSub.pending.StartDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : "N/A"}
                        </p>
                        <Button
                          onClick={handleCancelPending}
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Cancel Pending Subscription
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
