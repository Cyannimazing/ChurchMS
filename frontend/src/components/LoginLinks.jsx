"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/auth";

const LoginLinks = ({ mobile = false, handleLinkClick }) => {
  const { user } = useAuth({ middleware: "guest" });

  // Modern link classes matching navigation style
  const loginLinkClasses = mobile
    ? "block py-2 px-4 text-gray-700 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
    : "py-2 px-4 text-gray-700 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors font-medium";

  const registerLinkClasses = mobile
    ? "block py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
    : "py-2.5 px-5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm hover:shadow-md";

  const dashboardLinkClasses = mobile
    ? "block py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
    : "py-2.5 px-5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm hover:shadow-md";

  // Container classes
  const containerClasses = mobile
    ? "w-full space-y-2 mt-4"
    : "flex items-center space-x-3";

  return (
    <div className={containerClasses}>
      {user && user.profile.system_role.role_name ? (
        <>
          {user.profile.system_role.role_name === "Admin" && (
            <Link
              href="/admin-dashboard"
              className={dashboardLinkClasses}
              onClick={mobile ? handleLinkClick : undefined}
            >
              Dashboard
            </Link>
          )}
          {user.profile.system_role.role_name === "ChurchOwner" && (
            <Link
              href="/church"
              className={dashboardLinkClasses}
              onClick={mobile ? handleLinkClick : undefined}
            >
              Dashboard
            </Link>
          )}
          {user.profile.system_role.role_name === "Regular" && (
            <Link
              href="/dashboard"
              className={dashboardLinkClasses}
              onClick={mobile ? handleLinkClick : undefined}
            >
              Dashboard
            </Link>
          )}
          {user.profile.system_role.role_name === "ChurchStaff" && (
            <Link
              href={`/${user.church.ChurchName.replace(
                /\s+/g,
                "-"
              ).toLowerCase()}/dashboard`}
              className={dashboardLinkClasses}
              onClick={mobile ? handleLinkClick : undefined}
            >
              Dashboard
            </Link>
          )}
        </>
      ) : (
        <>
          <Link
            href="/login"
            className={loginLinkClasses}
            onClick={mobile ? handleLinkClick : undefined}
          >
            Login
          </Link>
          <Link
            href="/register"
            className={registerLinkClasses}
            onClick={mobile ? handleLinkClick : undefined}
          >
            Register
          </Link>
        </>
      )}
    </div>
  );
};

export default LoginLinks;
