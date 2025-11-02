"use client";

import { useAuth } from "@/hooks/auth.jsx";
import { useNotifications } from "@/hooks/useNotifications";
import { useParams } from "next/navigation";
import { Bell, Check, CheckCheck, Trash2, Calendar, CheckCircle2, XCircle, Info, Users, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ChurchStaffNotificationsPage() {
  const { user } = useAuth({ middleware: "auth" });
  const { churchname } = useParams();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(user, { churchname });

  const [filter, setFilter] = useState("all");

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.is_read;
    if (filter === "read") return notif.is_read;
    return true;
  });

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getIconBgClass = (type, message) => {
    const isApproved = message?.toLowerCase().includes('approved');
    const isCancelled = message?.toLowerCase().includes('cancelled');
    switch (type) {
      case "appointment_status_changed":
        if (isApproved) return "bg-green-50";
        if (isCancelled) return "bg-red-50";
        return "bg-blue-50";
      case "requirement_reminder":
        return "bg-amber-50";
      case "appointment_created":
        return "bg-blue-50";
      case "member_application":
        return "bg-purple-50";
      case "member_application_approved":
        return "bg-green-50";
      case "member_application_rejected":
        return "bg-gray-50";
      default:
        return "bg-gray-50";
    }
  };

  const getNotificationIcon = (type, message) => {
    const isApproved = message?.toLowerCase().includes('approved');
    const isCancelled = message?.toLowerCase().includes('cancelled');
    switch (type) {
      case "appointment_created":
        return <Calendar className="w-5 h-5 text-indigo-600" />;
      case "appointment_status_changed":
        if (isApproved) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
        if (isCancelled) return <XCircle className="w-5 h-5 text-red-600" />;
        return <Info className="w-5 h-5 text-blue-600" />;
      case "requirement_reminder":
        return <Bell className="w-5 h-5 text-amber-600" />;
      case "member_application":
        return <Users className="w-5 h-5 text-purple-600" />;
      case "member_application_approved":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "member_application_rejected":
        return <Info className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  // Check if user is ChurchOwner or has access
  const hasAccess =
    user?.profile?.system_role?.role_name === "ChurchOwner" ||
    user?.church_role?.permissions?.some(
      (perm) => perm.PermissionName === "appointment_list"
    );

  if (!hasAccess) {
    return (
      <div className="lg:p-6 w-full h-screen pt-20">
        <div className="w-full h-full">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
            <div className="p-6 bg-white border-b border-gray-200">
              <h2 className="text-xl font-semibold text-red-600">
                Unauthorized
              </h2>
              <p className="mt-2 text-gray-600">
                You do not have permission to access the Notifications page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="w-full h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          {/* Header */}
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Notifications
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread notification${
                        unreadCount > 1 ? "s" : ""
                      }`
                    : "All caught up! You have no new notifications"}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCheck size={18} />
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  filter === "all"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  filter === "unread"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter("read")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  filter === "read"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Read ({notifications.length - unreadCount})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="p-6 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading notifications...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell size={64} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === "unread"
                    ? "No unread notifications"
                    : filter === "read"
                    ? "No read notifications"
                    : "No notifications yet"}
                </h3>
                <p className="text-gray-600">
                  {filter === "all" && "You'll see notifications here when there are updates about appointments."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors ${
                      !notification.is_read ? "bg-blue-50 border-blue-200" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${getIconBgClass(notification.type, notification.message)}`}>
                        {getNotificationIcon(notification.type, notification.message)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-gray-900">
                                {notification.title}
                              </h3>
                              {!notification.is_read && <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                            </div>
                            <p className="text-sm text-gray-700 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5">
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1.5 text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                                title="Mark as read"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Additional info/action based on notification type */}
                        {(notification.type === "appointment_created" || notification.type === "appointment_status_changed") &&
                          notification.data?.appointment_id && (
                            <div className="mt-3">
                              <Link
                                href={`/${churchname}/appointment?appointmentId=${notification.data.appointment_id}`}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm"
                              >
                                <Eye size={14} />
                                View Appointment
                              </Link>
                            </div>
                          )}
                        {(notification.type === "member_application" || notification.type === "member_application_approved" || notification.type === "member_application_rejected") &&
                          notification.data?.application_id && (
                            <div className="mt-3">
                              <Link
                                href={`/${churchname}/member-applications?applicationId=${notification.data.application_id}`}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm"
                              >
                                <Eye size={14} />
                                View Application
                              </Link>
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
}
