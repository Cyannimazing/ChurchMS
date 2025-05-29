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
    <div className="lg:ml-75 lg:py-12 mx-3 py-20">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Your Subscription</h2>
              <Link href="/plans">
                <Button>Apply New Subscription</Button>
              </Link>
            </div>

            <div className="mt-6">
              {loading ? (
                <DataLoading message="Loading your subscription status..." />
              ) : currentSub?.active ? (
                <div className="p-4 border rounded-lg">
                  <h3 className="text-md font-medium">Current Subscription</h3>
                  <div className="mt-2 space-y-1">
                    <p>
                      <span className="font-medium">Plan:</span>{" "}
                      {currentSub.active.plan?.PlanName ?? "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Expires:</span>{" "}
                      {new Date(currentSub.active.EndDate).toLocaleString()}
                    </p>
                    {getWarningMessage() && (
                      <p className="text-red-600">{getWarningMessage()}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">
                    No active subscription. Please subscribe to access the
                    dashboard.
                  </p>
                </div>
              )}

              {currentSub?.pending && (
                <div className="mt-6 p-4 border border-yellow-200 rounded-lg">
                  <h3 className="text-md font-medium">Pending Subscription</h3>
                  <div className="mt-2 space-y-1">
                    <p>
                      <span className="font-medium">Plan:</span>{" "}
                      {currentSub.pending.plan?.PlanName ?? "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Starts:</span>{" "}
                      {currentSub.pending?.StartDate
                        ? new Date(
                            currentSub.pending.StartDate
                          ).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <Button
                    onClick={handleCancelPending}
                    className="mt-3 bg-red-600 hover:bg-red-700"
                  >
                    Cancel Pending Subscription
                  </Button>
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
