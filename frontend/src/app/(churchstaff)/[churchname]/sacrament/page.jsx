"use client";
import React from "react";
import { useAuth } from "@/hooks/auth.jsx";

const AppointmentPage = () => {
  const { user } = useAuth({ middleware: "auth" });

  // Check if user is ChurchOwner or has sacrament_list permission
  const hasAccess =
    user?.profile?.system_role?.role_name === "ChurchOwner" ||
    user?.church_role?.permissions?.some(
      (perm) => perm.PermissionName === "sacrament_list"
    );

  if (!hasAccess) {
    return (
      <div className="lg:ml-75 lg:py-12 mx-3 py-20">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 bg-white border-b border-gray-200">
              <h2 className="text-xl font-semibold text-red-600">
                Unauthorized
              </h2>
              <p className="mt-2 text-gray-600">
                You do not have permission to access the Sacrament page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:ml-75 lg:py-12 mx-3 py-20">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            SACRAMENT PAGE
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentPage;
