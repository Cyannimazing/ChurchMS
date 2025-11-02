"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import DataLoading from "@/components/DataLoading";
import Alert from "@/components/Alert";
import axios from "@/lib/axios";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Church,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Edit,
} from "lucide-react";
import Button from "@/components/Button";

const UserDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/api/users/${id}`);
        setUser(response.data);
      } catch (error) {
        setAlert({
          type: "error",
          title: "Error Loading User",
          message: error.response?.data?.error || "Failed to fetch user",
        });
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
      <div className="p-6 w-full h-full">
        <div className="w-full mx-auto">
          <DataLoading message="Loading user details..." />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="lg:p-6 w-full h-full pt-20">
        <div className="w-full mx-auto">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6 text-center text-gray-600">User not found.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="w-full mx-auto h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200 flex-1 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Link href="/users">
                  <Button
                    variant="outline"
                    className="px-3 flex py-2 text-sm font-medium text-gray-700 bg-white border-gray-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {getFullName(user.profile)}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    User Details & Information
                  </p>
                </div>
              </div>
              <Link href={`/users/${id}/edit`}>
                <Button variant="action">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
              </Link>
            </div>

            {/* Alert */}
            {alert && (
              <div className="mb-6">
                <Alert
                  type={alert.type}
                  title={alert.title}
                  message={alert.message}
                  onClose={() => setAlert(null)}
                />
              </div>
            )}

            {/* User Profile Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Overview */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-center">
                    <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                      <User className="h-12 w-12 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {getFullName(user.profile)}
                    </h3>
                    <div className="flex items-center justify-center mb-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          user.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" /> Inactive
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-center text-sm text-gray-500">
                      <Shield className="h-4 w-4 mr-2" />
                      {user.profile?.system_role?.role_name || "No Role"}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-gray-400" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                          {user.profile?.first_name || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                          {user.profile?.last_name || "Not provided"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Middle Name
                        </label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                          {user.profile?.middle_name || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-gray-400" />
                      Contact Information
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Email Address
                          </p>
                          <p className="text-sm text-gray-900">
                            {user.email || "Not provided"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Phone Number
                          </p>
                          <p className="text-sm text-gray-900">
                            {user.contact?.contact_number || "Not provided"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Address
                          </p>
                          <p className="text-sm text-gray-900">
                            {user.contact?.address || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-gray-400" />
                      System Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          System Role
                        </label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md capitalize">
                          {user.profile?.system_role?.role_name ||
                            "No role assigned"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Status
                        </label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                          {user.is_active ? "Active" : "Inactive"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Member Since
                        </label>
                        <div className="flex items-center text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(user.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Church Information - Different displays based on role */}
                  {user.profile?.system_role?.role_name === "ChurchOwner" && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Church className="h-5 w-5 mr-2 text-gray-400" />
                        Owned Churches
                      </h4>
                      <div className="space-y-3">
                        {user.churches && user.churches.length > 0 ? (
                          user.churches.map((church, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-md border"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <Church className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {church.ChurchName || church.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {church.ChurchStatus || "Active"}
                                  </p>
                                </div>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Owner
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                            No churches owned
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {user.profile?.system_role?.role_name === "Regular" && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Church className="h-5 w-5 mr-2 text-gray-400" />
                        Church Membership
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Member Of
                          </label>
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Church className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {user.church_membership?.ChurchName ||
                                  "No church membership"}
                              </p>
                              {user.church_membership && (
                                <p className="text-xs text-gray-500">
                                  Member
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {user.profile?.system_role?.role_name === "ChurchStaff" && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Church className="h-5 w-5 mr-2 text-gray-400" />
                        Church Affiliation
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Church Name
                          </label>
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <Church className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {user.church?.ChurchName ||
                                  "No church assigned"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {user.church?.ChurchStatus || "Active"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role in Church
                          </label>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                            {user.churchRole?.RoleName || "Staff Member"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
