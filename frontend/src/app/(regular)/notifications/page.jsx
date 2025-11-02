"use client";

import { useAuth } from "@/hooks/auth.jsx";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Check, CheckCheck, Trash2, Calendar, CheckCircle2, XCircle, Info, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function NotificationsPage() {
  const { user } = useAuth({ middleware: "auth" });
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(user);

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
      case "member_application_approved":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "member_application_rejected":
        return <Info className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

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
                  {filter === "all" && "You'll see notifications here when you have updates about your appointments."}
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

                        {/* Sub-services information */}
                        {notification.data?.sub_services && notification.data.sub_services.length > 0 && (
                          <div className="mt-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <h4 className="text-sm font-semibold text-purple-900 mb-2">Required:</h4>
                            <div className="space-y-3">
                              {notification.data.sub_services.map((subService) => (
                                <div key={subService.id} className="bg-white rounded p-3 border border-purple-100">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h5 className="text-sm font-medium text-gray-900">{subService.name}</h5>
                                      {subService.description && (
                                        <p className="text-xs text-gray-600 mt-1">{subService.description}</p>
                                      )}
                                    </div>
                                    {subService.is_completed !== undefined && (
                                      <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                                        subService.is_completed
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {subService.is_completed ? 'Completed' : 'Pending'}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Schedules */}
                                  {subService.schedules && subService.schedules.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs font-medium text-gray-700 mb-1">Schedule:</p>
                                      <div className="space-y-1">
                                        {subService.schedules.map((schedule, idx) => (
                                          <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            <span>
                                              {schedule.day} • {schedule.time}
                                              {schedule.occurrence === 'nth_day_of_month' && schedule.occurrence_value && (
                                                <span className="ml-1 text-gray-500">
                                                  ({schedule.occurrence_value === -1 ? 'Last' : 
                                                    schedule.occurrence_value === 1 ? '1st' :
                                                    schedule.occurrence_value === 2 ? '2nd' :
                                                    schedule.occurrence_value === 3 ? '3rd' : 
                                                    schedule.occurrence_value + 'th'} of month)
                                                </span>
                                              )}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Requirements */}
                                  {subService.requirements && subService.requirements.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs font-medium text-gray-700 mb-1">Requirements:</p>
                                      <ul className="space-y-0.5">
                                        {subService.requirements.map((req) => (
                                          <li key={req.id} className="text-xs text-gray-600 flex items-start gap-1">
                                            <span className="text-purple-600 mt-0.5">•</span>
                                            <span>{req.name}{req.needed ? ' (Required)' : ' (Optional)'}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional info/action based on notification type */}
                        {notification.type === "requirement_reminder" &&
                          notification.data?.appointment_id && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <p className="text-sm text-yellow-800">
                                <strong>Action Required:</strong> Please submit your
                                requirements within 72 hours to confirm your
                                appointment.
                              </p>
                              <Link
                                href={`/appointment?appointmentId=${notification.data.appointment_id}`}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                                className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors"
                              >
                                View Appointment
                              </Link>
                            </div>
                          )}
                        {notification.type === "appointment_status_changed" &&
                          notification.data?.appointment_id && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-800">
                                <strong>Status Update:</strong> Your appointment status has been updated.
                              </p>
                              <Link
                                href={`/appointment?appointmentId=${notification.data.appointment_id}`}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                                className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                              >
                                View Appointment
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
