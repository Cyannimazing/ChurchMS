"use client";
import React from "react";
import { useAuth } from "@/hooks/auth.jsx";

const SchedulePage = () => {
  const { user } = useAuth({ middleware: "auth" });

  // Check if user is ChurchOwner or has schedule_list permission
  const hasAccess =
    user?.profile?.system_role?.role_name === "ChurchOwner" ||
    user?.church_role?.permissions?.some(
      (perm) => perm.PermissionName === "schedule_list"
    );

  if (!hasAccess) {
    return (
      <div className="lg:p-6 w-full h-screen pt-20">
        <div className="max-w-7xl mx-auto h-full">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
            <div className="p-6 bg-white border-b border-gray-200">
              <h2 className="text-xl font-semibold text-red-600">
                Unauthorized
              </h2>
              <p className="mt-2 text-gray-600">
                You do not have permission to access the Schedule page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="max-w-7xl mx-auto h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">
              Church Schedules & Slots
            </h1>
          </div>
          <div className="p-6 flex-1">
            <p className="text-gray-600">
              Welcome to the Church Schedule and Slot Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
