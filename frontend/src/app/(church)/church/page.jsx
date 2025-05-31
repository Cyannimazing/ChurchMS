"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import DataLoading from "@/components/DataLoading";
import toast, { Toaster } from "react-hot-toast";
import { Transition, Menu } from "@headlessui/react";
import Button from "@/components/Button";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Globe,
  Users,
  Shield,
  BookOpen,
  Settings,
  AlertCircle,
  MoreVertical,
  Edit,
  Eye,
  ChevronDown,
  Upload,
} from "lucide-react";
import FileInput from "@/components/Forms/FileInput";
import Link from "next/link";

const Dashboard = () => {
  const router = useRouter();
  const [churches, setChurches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const [formData, setFormData] = useState({
    ChurchName: "",
    Latitude: "",
    Longitude: "",
    Description: "",
    ParishDetails: "",
    ProfilePicture: null,
    SEC: null,
    BIR: null,
    BarangayPermit: null,
    AuthorizationLetter: null,
    RepresentativeID: null,
  });
  const [error, setError] = useState(null);
  const [loadingChurch, setLoadingChurch] = useState(false);
  const [isLoadingChurches, setIsLoadingChurches] = useState(false);

  useEffect(() => {
    fetchChurches();
  }, []);

  const fetchChurches = async () => {
    setIsLoadingChurches(true);
    try {
      const response = await axios.get("/api/churches/owned");
      setChurches(response.data.churches);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Please log in to view your churches.");
        router.push("/login");
      } else {
        setError(
          err.response?.data?.error ||
            "Failed to fetch churches. Please try again."
        );
      }
    } finally {
      setIsLoadingChurches(false);
    }
  };

  // Toggle church's public status
  const togglePublishStatus = async (churchId) => {
    setActionLoading((prev) => ({ ...prev, [churchId]: true }));
    try {
      // Find the church to get its current public status
      const church = churches.find((c) => c.ChurchID === churchId);
      if (!church) return;

      // Make API call to toggle status
      await axios.put(`/api/churches/${churchId}/publish`, {
        IsPublic: !church.IsPublic,
      });

      // Update local state
      setChurches(
        churches.map((c) => {
          if (c.ChurchID === churchId) {
            return { ...c, IsPublic: !c.IsPublic };
          }
          return c;
        })
      );

      // Show success message
      toast.success(
        church.IsPublic
          ? "Church has been unpublished"
          : "Church has been published"
      );
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update publishing status. Please try again.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [churchId]: false }));
    }
  };

  // View document details
  const viewDocuments = async (churchId) => {
    router.push(`/church/documents/${churchId}`);
  };

  // Navigate to staff management
  const manageStaff = (churchId, churchName) => {
    const formattedName = churchName.replace(/\s+/g, "-").toLowerCase();
    router.push(`/${formattedName}/employee`);
  };

  // Navigate to role management
  const manageRoles = (churchId, churchName) => {
    const formattedName = churchName.replace(/\s+/g, "-").toLowerCase();
    router.push(`/${formattedName}/role`);
  };

  // Navigate to sacrament management
  const manageSacraments = (churchId, churchName) => {
    const formattedName = churchName.replace(/\s+/g, "-").toLowerCase();
    router.push(`/${formattedName}/sacrament`);
  };

  const handleManage = (churchName) => {
    const formattedName = churchName.replace(/\s+/g, "-").toLowerCase();
    router.push(`/${formattedName}/dashboard`);
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    let bgColor, textColor, icon;

    switch (status) {
      case "Active":
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        icon = <CheckCircle className="h-4 w-4 mr-1" />;
        break;
      case "Pending":
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-800";
        icon = <Clock className="h-4 w-4 mr-1" />;
        break;
      case "Rejected":
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        icon = <XCircle className="h-4 w-4 mr-1" />;
        break;
      default:
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
        icon = <AlertCircle className="h-4 w-4 mr-1" />;
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
      >
        {icon}
        {status}
      </span>
    );
  };

  // Document Status Badge Component
  const DocumentStatusBadge = ({ count }) => {
    let bgColor, textColor;

    if (count === 0) {
      bgColor = "bg-red-100";
      textColor = "text-red-800";
    } else if (count < 3) {
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
    } else {
      bgColor = "bg-green-100";
      textColor = "text-green-800";
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
      >
        <FileText className="h-4 w-4 mr-1" />
        {count} Document{count !== 1 ? "s" : ""}
      </span>
    );
  };

  return (
    <div className="lg:ml-75 lg:py-12 mx-3 py-20 ">
      {/* Add Toaster component for toast notifications */}
      <Toaster />
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 min-h-screen">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg min-h-screen">
          <div className="p-6 bg-white border-b border-gray-200 min-h-screen">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">My Churches</h1>
            </div>

            {/* Enhanced Error Display with Transition */}
            <Transition
              show={error && !showModal}
              enter="transition-opacity duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            </Transition>

            {/* Church Cards View */}
            {isLoadingChurches ? (
              <div className="flex justify-center py-12">
                <DataLoading message="Loading your churches..." />
              </div>
            ) : churches.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <div className="p-6">
                  <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center rounded-full bg-gray-100">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-medium text-gray-900">
                    No churches found
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Get started by creating a new church.
                  </p>
                  <div className="mt-6">
                    <Button>
                      <Link href={"/registerchurch"}>Create Church</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {churches.map((church) => (
                  <div
                    key={church.ChurchID}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <h3
                          className="text-lg font-medium text-gray-900 mb-1 truncate max-w-[80%]"
                          title={church.ChurchName}
                        >
                          {church.ChurchName}
                        </h3>

                        {/* Actions Menu */}
                        <Menu
                          as="div"
                          className="relative inline-block text-left"
                        >
                          <Menu.Button className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <MoreVertical className="h-5 w-5" />
                          </Menu.Button>

                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10">
                              <div className="py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() =>
                                        handleManage(church.ChurchName)
                                      }
                                      className={`${
                                        active
                                          ? "bg-gray-100 text-gray-900"
                                          : "text-gray-700"
                                      } group flex items-center px-4 py-2 text-sm w-full text-left`}
                                      disabled={
                                        church.ChurchStatus !== "Active"
                                      }
                                    >
                                      <Eye className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                      View Dashboard
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() =>
                                        router.push(
                                          `/church/edit/${church.ChurchID}`
                                        )
                                      }
                                      className={`${
                                        active
                                          ? "bg-gray-100 text-gray-900"
                                          : "text-gray-700"
                                      } group flex items-center px-4 py-2 text-sm w-full text-left`}
                                    >
                                      <Edit className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                      Edit Church
                                    </button>
                                  )}
                                </Menu.Item>
                              </div>

                              <div className="py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() =>
                                        manageStaff(
                                          church.ChurchID,
                                          church.ChurchName
                                        )
                                      }
                                      className={`${
                                        active
                                          ? "bg-gray-100 text-gray-900"
                                          : "text-gray-700"
                                      } group flex items-center px-4 py-2 text-sm w-full text-left`}
                                      disabled={
                                        church.ChurchStatus !== "Active"
                                      }
                                    >
                                      <Users className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                      Manage Staff
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() =>
                                        manageRoles(
                                          church.ChurchID,
                                          church.ChurchName
                                        )
                                      }
                                      className={`${
                                        active
                                          ? "bg-gray-100 text-gray-900"
                                          : "text-gray-700"
                                      } group flex items-center px-4 py-2 text-sm w-full text-left`}
                                      disabled={
                                        church.ChurchStatus !== "Active"
                                      }
                                    >
                                      <Shield className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                      Manage Roles
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() =>
                                        manageSacraments(
                                          church.ChurchID,
                                          church.ChurchName
                                        )
                                      }
                                      className={`${
                                        active
                                          ? "bg-gray-100 text-gray-900"
                                          : "text-gray-700"
                                      } group flex items-center px-4 py-2 text-sm w-full text-left`}
                                      disabled={
                                        church.ChurchStatus !== "Active"
                                      }
                                    >
                                      <BookOpen className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                      Manage Sacraments
                                    </button>
                                  )}
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <StatusBadge status={church.ChurchStatus} />
                        {church.IsPublic && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Globe className="h-4 w-4 mr-1" />
                            Public
                          </span>
                        )}
                        <DocumentStatusBadge count={church.DocumentCount} />
                      </div>

                      {/* Church Description */}
                      <p
                        className="mt-3 text-sm text-gray-500 line-clamp-2"
                        title={church.Description || "No description available"}
                      >
                        {church.Description || "No description available"}
                      </p>

                      {/* Church Actions */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {church.ChurchStatus === "Active" && (
                          <>
                            <Button
                              onClick={() => handleManage(church.ChurchName)}
                              variant="primary"
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Dashboard
                            </Button>

                            <Button
                              onClick={() =>
                                togglePublishStatus(church.ChurchID)
                              }
                              variant={
                                church.IsPublic ? "secondary" : "outline"
                              }
                              className="text-xs"
                              disabled={actionLoading[church.ChurchID]}
                            >
                              {actionLoading[church.ChurchID] ? (
                                <span className="flex items-center">
                                  <svg
                                    className="animate-spin h-3 w-3 mr-1"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Processing...
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <Globe className="h-3 w-3 mr-1" />
                                  {church.IsPublic ? "Unpublish" : "Publish"}
                                </span>
                              )}
                            </Button>
                          </>
                        )}

                        {church.ChurchStatus === "Pending" && (
                          <div className="text-xs text-yellow-600 flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            Awaiting admin approval
                          </div>
                        )}

                        {church.ChurchStatus === "Rejected" && (
                          <div className="text-xs text-red-600 flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Application rejected - Contact admin
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
