"use client";
import React, { useState, useEffect } from "react";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import DataLoading from "@/components/DataLoading";
import toast from "react-hot-toast";
import axios from "@/lib/axios";
import Link from "next/link";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingUserId, setLoadingUserId] = useState(null); // Track loading for specific user

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        await axios.get("/sanctum/csrf-cookie");
        const response = await axios.get("/api/users_list", {
          headers: { Accept: "application/json" },
        });
        console.log("Fetched users:", response.data);
        setUsers(response.data);
      } catch (error) {
        const errorMessage =
          error.response?.data?.error || "Failed to fetch users";
        toast.error(errorMessage);
        console.error("Fetch users error:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="lg:ml-75 lg:py-12 mx-3 py-20">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">User List</h1>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 text-left">
                    <th className="p-3 text-sm font-semibold">Full Name</th>
                    <th className="p-3 text-sm font-semibold">System Role</th>
                    <th className="p-3 text-sm font-semibold">Active Status</th>
                    <th className="p-3 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody aria-live="polite">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="p-3 text-center">
                        <DataLoading message="Loading users..." />
                      </td>
                    </tr>
                  ) : users.length ? (
                    users.map((user, index) => (
                      <tr
                        key={user.id}
                        className={`border-t border-gray-200 hover:bg-gray-50 transition-opacity duration-300 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                      >
                        <td className="p-3 text-sm text-gray-900">
                          {user.full_name}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {user.system_role_name}
                        </td>
                        <td className="p-3 text-sm">
                          <button
                            onClick={() =>
                              handleActiveStatusChange(user.id, !user.is_active)
                            }
                            className={`flex items-center border rounded p-1 text-sm ${
                              user.is_active
                                ? "text-green-500 hover:text-green-700"
                                : "text-red-500 hover:text-red-700"
                            }`}
                            disabled={loadingUserId === user.id} // Disable only this button
                            aria-label={`Toggle active status for ${user.full_name}`}
                          >
                            {user.is_active ? (
                              <>
                                <CheckCircle className="inline mr-1 h-4 w-4" />
                                True
                              </>
                            ) : (
                              <>
                                <XCircle className="inline mr-1 h-4 w-4" />
                                False
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-3">
                          <Link
                            href={`/users/${user.id}`}
                            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                          >
                            <Eye className="mr-1 h-4 w-4" /> View
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="transition-opacity duration-300">
                      <td
                        colSpan={4}
                        className="p-3 text-center text-sm text-gray-600"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
