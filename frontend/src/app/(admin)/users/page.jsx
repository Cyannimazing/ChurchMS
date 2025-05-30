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
        const response = await axios.get("/api/users_list");
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
    <div className="lg:ml-72 mx-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">User List</h1>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      System Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="bg-white divide-y divide-gray-200"
                  aria-live="polite"
                >
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4">
                        <DataLoading message="Loading users..." />
                      </td>
                    </tr>
                  ) : users.length ? (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {user.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {user.system_role_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() =>
                              handleActiveStatusChange(user.id, !user.is_active)
                            }
                            className={`flex items-center text-sm ${
                              user.is_active
                                ? "text-green-600 hover:text-green-800"
                                : "text-red-600 hover:text-red-800"
                            }`}
                            disabled={loadingUserId === user.id}
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/users/${user.id}`}
                            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                            aria-label={`View details for ${user.full_name}`}
                          >
                            <Eye className="mr-1 h-4 w-4" /> View
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-sm text-gray-700"
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
