"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth.jsx";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DataLoading from "@/components/DataLoading";
import Alert from "@/components/Alert";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Label from "@/components/Label";
import InputError from "@/components/InputError";
import axios from "@/lib/axios";
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
  Lock,
  Save,
  Edit,
  ArrowLeft,
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const [fullUser, setFullUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [errors, setErrors] = useState({});

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    contact_number: "",
    address: "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user) return;
      
      try {
        const response = await axios.get(`/api/users/${user.id}`);
        const userData = response.data;
        setFullUser(userData);
        
        setProfileData({
          first_name: userData.profile?.first_name || "",
          middle_name: userData.profile?.middle_name || "",
          last_name: userData.profile?.last_name || "",
          contact_number: userData.contact?.contact_number || "",
          address: userData.contact?.address || "",
        });
      } catch (error) {
        setAlert({
          type: "error",
          title: "Error Loading Profile",
          message: error.response?.data?.error || "Failed to fetch profile",
        });
        console.error("Fetch profile error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUserDetails();
    }
  }, [user]);

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

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors({});
    setAlert(null);

    try {
      await axios.put(`/api/users/${user.id}/profile`, profileData);
      setAlert({
        type: "success",
        title: "Profile Updated",
        message: "Your profile has been updated successfully.",
      });
      // Refresh user data
      const response = await axios.get(`/api/users/${user.id}`);
      setFullUser(response.data);
      setActiveTab('overview');
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      }
      setAlert({
        type: "error",
        title: "Update Failed",
        message:
          error.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors({});
    setAlert(null);

    try {
      await axios.put(`/api/users/${user.id}/password`, passwordData);
      setAlert({
        type: "success",
        title: "Password Changed",
        message: "Your password has been changed successfully.",
      });
      setPasswordData({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      }
      setAlert({
        type: "error",
        title: "Update Failed",
        message:
          error.response?.data?.message || "Failed to change password.",
      });
    } finally {
      setIsSaving(false);
    };
  };

  const getDashboardLink = () => {
    if (!fullUser?.profile?.system_role?.role_name) return '/dashboard';
    
    const roleName = fullUser.profile.system_role.role_name;
    
    switch(roleName) {
      case 'Admin':
        return '/admin-dashboard';
      case 'ChurchOwner':
        return '/church';
      case 'ChurchStaff':
        // Get church name from user's church
        if (fullUser.church?.ChurchName) {
          const churchSlug = fullUser.church.ChurchName.toLowerCase().replace(/\s+/g, '-');
          return `/${churchSlug}/dashboard`;
        }
        return '/dashboard';
      case 'Regular':
      default:
        return '/dashboard';
    }
  };

  if (isLoading || !fullUser) {
    return (
      <div className="lg:p-6 w-full h-screen pt-20">
        <div className="w-full mx-auto h-full">
          <DataLoading message="Loading profile..." />
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="w-full mx-auto h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200 flex-1 overflow-auto">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Link href={getDashboardLink()}>
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
                    My Profile
                  </h1>
                </div>
              </div>
            </div>

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

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                    activeTab === 'overview'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <User className="inline h-5 w-5 mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                    activeTab === 'edit'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Edit className="inline h-5 w-5 mr-2" />
                  Edit Profile
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                    activeTab === 'security'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Lock className="inline h-5 w-5 mr-2" />
                  Security
                </button>
              </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Overview */}
                <div className="lg:col-span-1">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="text-center">
                      <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                        <User className="h-12 w-12 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {getFullName(fullUser.profile)}
                      </h3>
                      <div className="flex items-center justify-center mb-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            fullUser.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {fullUser.is_active ? (
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
                        {fullUser.profile?.system_role?.role_name || "No Role"}
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
                            {fullUser.profile?.first_name || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                            {fullUser.profile?.last_name || "Not provided"}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Middle Name
                          </label>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                            {fullUser.profile?.middle_name || "Not provided"}
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
                              {fullUser.email || "Not provided"}
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
                              {fullUser.contact?.contact_number || "Not provided"}
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
                              {fullUser.contact?.address || "Not provided"}
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
                            {fullUser.profile?.system_role?.role_name ||
                              "No role assigned"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Status
                          </label>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                            {fullUser.is_active ? "Active" : "Inactive"}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Member Since
                          </label>
                          <div className="flex items-center text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {formatDate(fullUser.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Church Information - Regular Users */}
                    {fullUser.profile?.system_role?.role_name === "Regular" && fullUser.church_membership && (
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
                                  {fullUser.church_membership?.ChurchName ||
                                    "No church membership"}
                                </p>
                                {fullUser.church_membership && (
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

                    {/* Church Information - ChurchStaff */}
                    {fullUser.profile?.system_role?.role_name === "ChurchStaff" && fullUser.church && (
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
                                  {fullUser.church?.ChurchName ||
                                    "No church assigned"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {fullUser.church?.ChurchStatus || "Active"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Role in Church
                            </label>
                            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                              {fullUser.churchRole?.RoleName || "Staff Member"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Church Information - ChurchOwner */}
                    {fullUser.profile?.system_role?.role_name === "ChurchOwner" && fullUser.churches && fullUser.churches.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <Church className="h-5 w-5 mr-2 text-gray-400" />
                          Owned Churches
                        </h4>
                        <div className="space-y-3">
                          {fullUser.churches.map((church, index) => (
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
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Edit Profile Tab */}
            {activeTab === 'edit' && (
              <div className="max-w-3xl">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">
                    Edit Profile Information
                  </h3>
                  <form onSubmit={handleProfileSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          type="text"
                          value={profileData.first_name}
                          onChange={handleProfileChange}
                          className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                        />
                        <InputError
                          messages={errors.first_name}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          type="text"
                          value={profileData.last_name}
                          onChange={handleProfileChange}
                          className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                        />
                        <InputError
                          messages={errors.last_name}
                          className="mt-2"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="middle_name">Middle Name</Label>
                        <Input
                          id="middle_name"
                          name="middle_name"
                          type="text"
                          value={profileData.middle_name}
                          onChange={handleProfileChange}
                          className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                          placeholder="Optional"
                        />
                        <InputError
                          messages={errors.middle_name}
                          className="mt-2"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="contact_number">Phone Number</Label>
                        <Input
                          id="contact_number"
                          name="contact_number"
                          type="text"
                          value={profileData.contact_number}
                          onChange={handleProfileChange}
                          className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                          placeholder="e.g., 09123456789"
                        />
                        <InputError
                          messages={errors.contact_number}
                          className="mt-2"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          name="address"
                          type="text"
                          value={profileData.address}
                          onChange={handleProfileChange}
                          className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                          placeholder="Full address"
                        />
                        <InputError messages={errors.address} className="mt-2" />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button
                        type="submit"
                        variant="action"
                        disabled={isSaving}
                        className="inline-flex items-center"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="max-w-3xl">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">
                    Change Password
                  </h3>
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="current_password">Current Password</Label>
                        <Input
                          id="current_password"
                          name="current_password"
                          type="password"
                          value={passwordData.current_password}
                          onChange={handlePasswordChange}
                          className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                          placeholder="Enter current password"
                        />
                        <InputError
                          messages={errors.current_password}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new_password">New Password</Label>
                        <Input
                          id="new_password"
                          name="new_password"
                          type="password"
                          value={passwordData.new_password}
                          onChange={handlePasswordChange}
                          className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                          placeholder="Enter new password (min 8 characters)"
                        />
                        <InputError
                          messages={errors.new_password}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new_password_confirmation">
                          Confirm New Password
                        </Label>
                        <Input
                          id="new_password_confirmation"
                          name="new_password_confirmation"
                          type="password"
                          value={passwordData.new_password_confirmation}
                          onChange={handlePasswordChange}
                          className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                          placeholder="Confirm new password"
                        />
                        <InputError
                          messages={errors.new_password_confirmation}
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button
                        type="submit"
                        variant="action"
                        disabled={isSaving}
                        className="inline-flex items-center"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        {isSaving ? "Changing..." : "Change Password"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
