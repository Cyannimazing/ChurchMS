"use client";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import DataLoading from "@/components/DataLoading";
import toast from "react-hot-toast";
import axios from "@/lib/axios";
import Link from "next/link";

const UserDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("Fetching CSRF token...");
        await axios.get("/sanctum/csrf-cookie");
        console.log("CSRF token fetched, fetching user...");
        const response = await axios.get(`/api/users/${id}`, {
          headers: { Accept: "application/json" },
        });
        console.log("Fetched user data for id", id, ":", response.data);
        setUser(response.data);
      } catch (error) {
        toast.error(error.response?.data?.error || "Failed to fetch user");
        console.error("Fetch user error:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      fetchUser();
    }
  }, [id]);

  const handleActiveStatusChange = async (e) => {
    const isActive = e.target.value === "true" ? 1 : 0; // Map "true"/"false" to 1/0
    console.log("Dropdown change triggered:", {
      isActive,
      userId: id,
      currentUserState: user,
    });

    setIsUpdating(true);
    try {
      console.log("Sending PUT request:", { is_active: isActive });
      const response = await axios.put(`/api/users/${id}/update-active`, {
        is_active: isActive, // Send 1 or 0
      });
      console.log("API response:", response.data);

      setUser((prev) => {
        let newIsActive;
        if (response.data.user.is_active === true) {
          newIsActive = 1;
        } else if (response.data.user.is_active === false) {
          newIsActive = 0;
        }
        const updatedUser = { ...prev, is_active: newIsActive };
        console.log("New user state:", updatedUser);
        return updatedUser;
      });
      toast.success("User status updated!");
    } catch (error) {
      const errorDetails = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      };
      console.error("Update error:", errorDetails);
      toast.error(error.response?.data?.message || "Update failed!");
    } finally {
      setIsUpdating(false);
      console.log("isUpdating set to false");
    }
  };
  // Compute full name with proper capitalization and middle initial formatting
  const getFullName = (profile) => {
    if (!profile) return "N/A";
    const { first_name, middle_name, last_name } = profile;
    const capitalize = (str) =>
      str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
    const parts = [
      capitalize(first_name),
      middle_name ? `${capitalize(middle_name.charAt(0))}.` : "",
      capitalize(last_name),
    ].filter(Boolean);
    return parts.join(" ") || "N/A";
  };

  // Format created_at date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }) || "N/A"
    );
  };

  if (isLoading) {
    return (
      <div className="lg:ml-75 lg:py-12 mx-3 py-20">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <DataLoading message="Loading user details..." />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="lg:ml-75 lg:py-12 mx-3 py-20">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="text-center p-6 text-gray-600">User not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:ml-75 lg:py-12 mx-3 py-20">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              User Details
            </h1>
            <div className="space-y-4">
              <p>
                <strong>Full Name:</strong> {getFullName(user.profile)}
              </p>
              <p>
                <strong>Email:</strong> {user.email ?? "N/A"}
              </p>
              <p>
                <strong>Contact Number:</strong>{" "}
                {user.contact?.contact_number ?? "N/A"}
              </p>
              <p>
                <strong>Address:</strong> {user.contact?.address ?? "N/A"}
              </p>
              <p>
                <strong>First Name:</strong> {user.profile?.first_name ?? "N/A"}
              </p>
              <p>
                <strong>Middle Name:</strong>{" "}
                {user.profile?.middle_name ?? "N/A"}
              </p>
              <p>
                <strong>Last Name:</strong> {user.profile?.last_name ?? "N/A"}
              </p>
              <p>
                <strong>System Role:</strong>{" "}
                {user.profile?.system_role?.role_name ?? "N/A"}
              </p>
              <p>
                <strong>Join in:</strong> {formatDate(user.created_at)}
              </p>
              {user.profile?.system_role?.role_name === "churchowner" && (
                <>
                  <p>
                    <strong>Church:</strong> {user.church?.name ?? "N/A"}
                  </p>
                  <p>
                    <strong>Church Role:</strong>{" "}
                    {user.churchRole?.name ?? "N/A"}
                  </p>
                </>
              )}
              <div>
                <label
                  htmlFor="is_active"
                  className="block text-sm font-medium text-gray-700"
                >
                  Active Status
                </label>
                <select
                  id="is_active"
                  value={user.is_active ? "true" : "false"}
                  onChange={handleActiveStatusChange}
                  onClick={() => console.log("Dropdown clicked for user", id)}
                  className={`mt-1 w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 ${
                    isUpdating ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isUpdating}
                  aria-label={`Toggle active status for ${getFullName(
                    user.profile
                  )}`}
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
                {isUpdating && (
                  <span className="ml-2 text-sm text-gray-500">
                    Updating...
                  </span>
                )}
              </div>
            </div>
            <Link
              href="/users"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800 text-sm"
            >
              Back to User List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
