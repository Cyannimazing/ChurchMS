"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import DataLoading from "@/components/DataLoading";
import Alert from "@/components/Alert";
import ConfirmDialog from "@/components/ConfirmDialog";
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
  Church,
  Plus,
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
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [loadingChurch, setLoadingChurch] = useState(false);
  const [isLoadingChurches, setIsLoadingChurches] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, churchId: null, action: null });
  const [isConfirming, setIsConfirming] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    fetchChurches();
    fetchSubscription();
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

  const fetchSubscription = async () => {
    try {
      const response = await axios.get("/api/church-subscriptions");
      setSubscription(response.data);
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
    }
  };

  // Show confirmation dialog for publish/unpublish
  const handleTogglePublish = (churchId) => {
    const church = churches.find((c) => c.ChurchID === churchId);
    if (!church) return;

    // Check if trying to publish without payment configuration
    if (!church.IsPublic && !church.HasPaymentConfig) {
      setAlertMessage('You need to configure PayMongo payment gateway before publishing your church.');
      setAlertType('warning');
      return;
    }

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      churchId: churchId,
      action: church.IsPublic ? 'unpublish' : 'publish',
      church: church
    });
  };

  // Toggle church's public status (actual API call)
  const togglePublishStatus = async (churchId) => {
    setIsConfirming(true);
    setActionLoading((prev) => ({ ...prev, [churchId]: true }));
    try {
      // Find the church to get its current public status
      const church = churches.find((c) => c.ChurchID === churchId);
      if (!church) {
        setActionLoading((prev) => ({ ...prev, [churchId]: false }));
        return;
      }

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
      setAlertMessage(church.IsPublic
        ? "Church has been unpublished"
        : "Church has been published");
      setAlertType('success');
    } catch (error) {
      console.error("Error toggling publish status:", error);
      
      // Handle PayMongo requirement error
      if (error.response?.data?.requires_payment_setup) {
        setAlertMessage(error.response.data.message);
        setAlertType('warning');
      } else {
        const errorMessage = error.response?.data?.message || "Failed to update publishing status. Please try again.";
        setAlertMessage(errorMessage);
        setAlertType('error');
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [churchId]: false }));
      setIsConfirming(false);
      setConfirmDialog({ isOpen: false, churchId: null, action: null });
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
      case "Disabled":
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
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
    <>
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="w-full mx-auto h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex justify-between items-center w-full">
            <h1 className="text-2xl font-semibold text-gray-900">
              My Churches
            </h1>

            {alertMessage && (
              <div className="mb-6">
                <Alert
                  type={alertType}
                  message={alertMessage}
                  onClose={() => setAlertMessage("")}
                  autoClose={true}
                  autoCloseDelay={5000}
                />
              </div>
            )}
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  {churches.length}/{subscription?.active?.plan?.MaxChurchesAllowed ?? 0}
                </div>
                <Button>
                  <Link href="/registerchurch" className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Church
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6 flex-1">
            <div className="h-full overflow-y-auto">

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
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
                <svg
                  className="w-5 h-5 mr-3 text-red-500"
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
                <span className="font-medium">{error}</span>
              </div>
            </Transition>

              {/* Church Cards View */}
              {isLoadingChurches ? (
                <div className="flex justify-center py-12">
                  <DataLoading message="Loading your churches..." />
                </div>
              ) : churches.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="p-8">
                    <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-slate-100">
                      <Church className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">
                      No churches found
                    </h3>
                    <p className="mt-2 text-gray-600 max-w-sm mx-auto">
                      Get started by registering your first church to begin managing your religious community.
                    </p>
                    <div className="mt-8">
                      <Button>
                        <Link href={"/registerchurch"} className="flex items-center">
                          <Plus className="h-4 w-4 mr-2" />
                          Register Your First Church
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Churches</h2>
                    <p className="text-sm text-gray-600">Manage and monitor all your registered churches</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                    {churches.map((church) => (
                      <div
                        key={church.ChurchID}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300"
                      >
                        <div className="p-6">
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
                                      } group flex items-center px-4 py-2 text-sm w-full text-left disabled:opacity-50 disabled:cursor-not-allowed`}
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
                                      } group flex items-center px-4 py-2 text-sm w-full text-left disabled:opacity-50 disabled:cursor-not-allowed`}
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
                                      } group flex items-center px-4 py-2 text-sm w-full text-left disabled:opacity-50 disabled:cursor-not-allowed`}
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
                                      } group flex items-center px-4 py-2 text-sm w-full text-left disabled:opacity-50 disabled:cursor-not-allowed`}
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
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            <Globe className="h-4 w-4 mr-1" />
                            Public
                          </span>
                        )}
                        <DocumentStatusBadge count={church.DocumentCount} />
                        {church.ChurchStatus === 'Active' && church.HasPaymentConfig && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            Payment Ready
                          </span>
                        )}
                      </div>

                      {/* Church Description */}
                      <p
                        className="mt-3 text-sm text-gray-500 line-clamp-2"
                        title={church.ChurchProfile?.Description || "No description available"}
                      >
                        {church.ChurchProfile?.Description || "No description available"}
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
                                handleTogglePublish(church.ChurchID)
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

                        {church.ChurchStatus === "Disabled" && (
                          <div className="text-xs text-gray-600 flex items-center mt-1">
                            <XCircle className="h-3 w-3 mr-1" />
                            Church disabled - Subscription expired
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Confirmation Dialog */}
    <ConfirmDialog
      isOpen={confirmDialog.isOpen}
      onClose={() => !isConfirming && setConfirmDialog({ isOpen: false, churchId: null, action: null })}
      onConfirm={() => togglePublishStatus(confirmDialog.churchId)}
      title={`${confirmDialog.action === 'publish' ? 'Publish' : 'Unpublish'} Church`}
      message={`Are you sure you want to ${confirmDialog.action} "${confirmDialog.church?.ChurchName}"? ${confirmDialog.action === 'publish' ? 'This will make your church visible to the public.' : 'This will hide your church from public view.'}`}
      confirmText={isConfirming ? 'Processing...' : (confirmDialog.action === 'publish' ? 'Publish' : 'Unpublish')}
      cancelText="Cancel"
      type={confirmDialog.action === 'unpublish' ? 'warning' : 'info'}
      isLoading={isConfirming}
    />
    </>
  );
};

export default Dashboard;
