"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/auth";

const LoginLinks = () => {
  const { user } = useAuth({ middleware: "guest" });

  console.log("user", user);
  return (
    <div className="hidden fixed top-0 right-0 px-6 py-4 sm:block">
      {user && user.profile.system_role.role_name && (
        <>
          {user.profile.system_role.role_name === "Admin" && (
            <Link
              href="/admin"
              className="ml-4 text-sm text-gray-700 underline"
            >
              Dashboard
            </Link>
          )}
          {user.profile.system_role.role_name === "ChurchOwner" && (
            <Link
              href="/church"
              className="ml-4 text-sm text-gray-700 underline"
            >
              Dashboard
            </Link>
          )}
          {user.profile.system_role.role_name === "Regular" && (
            <Link
              href="/dashboard"
              className="ml-4 text-sm text-gray-700 underline"
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
              className="ml-4 text-sm text-gray-700 underline"
            >
              Dashboard
            </Link>
          )}
        </>
      )}
      {!user && (
        <>
          <Link href="/login" className="text-sm text-gray-700 underline">
            Login
          </Link>
          <Link
            href="/register"
            className="ml-4 text-sm text-gray-700 underline"
          >
            Register
          </Link>
        </>
      )}
    </div>
  );
};

export default LoginLinks;
