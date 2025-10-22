"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/auth";

const LoginLinks = ({ mobile = false, handleLinkClick }) => {
  const { user } = useAuth({ middleware: "guest" });

  console.log("user", user);

  // Base classes for links with button design and font styling
  const linkClasses = mobile
    ? "block py-2 px-4 text-black bg-white border border-gray-300 rounded-md hover:bg-gray-100 font-medium text-base transition-colors"
    : "py-2 px-4 text-black bg-white border border-gray-300 rounded-md hover:bg-gray-100 font-medium text-base transition-colors";

  // Container classes (unchanged functionality)
  const containerClasses = mobile
    ? "w-full"
    : "fixed  top-0 right-0 px-6 py-5 hidden lg:block z-[70]";

  return (
    <div className={containerClasses}>
      {user && user.profile.system_role.role_name ? (
        <>
          {user.profile.system_role.role_name === "Admin" && (
            <Link
              href="/admin"
              className={mobile ? linkClasses : `${linkClasses} ml-4`}
              onClick={mobile ? handleLinkClick : undefined}
            >
              Dashboard
            </Link>
          )}
          {user.profile.system_role.role_name === "ChurchOwner" && (
            <Link
              href="/church"
              className={mobile ? linkClasses : `${linkClasses} ml-4`}
              onClick={mobile ? handleLinkClick : undefined}
            >
              Dashboard
            </Link>
          )}
          {user.profile.system_role.role_name === "Regular" && (
            <Link
              href="/dashboard"
              className={mobile ? linkClasses : `${linkClasses} ml-4`}
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
              className={mobile ? linkClasses : `${linkClasses} ml-4`}
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
            className={linkClasses}
            onClick={mobile ? handleLinkClick : undefined}
          >
            Login
          </Link>
          <Link
            href="/register"
            className={mobile ? `${linkClasses} mt-2` : `${linkClasses} ml-4`}
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
