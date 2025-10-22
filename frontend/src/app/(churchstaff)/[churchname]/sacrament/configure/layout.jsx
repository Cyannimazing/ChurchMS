"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useAuth } from "@/hooks/auth.jsx";
import Loading from "@/components/Loading.jsx";

const ConfigureLayout = ({ children }) => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const { churchname } = useParams();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    if (user) {
      const role = user.profile.system_role.role_name;

      if (role === "ChurchStaff") {
        const userChurchName = user.church.ChurchName.toLowerCase().replace(
          /\s+/g,
          "-"
        );
        if (userChurchName === churchname) {
          setIsRedirecting(false);
        } else if (pathname !== "/") {
          router.replace("/");
        } else {
          setIsRedirecting(false);
        }
      } else if (role === "ChurchOwner") {
        const hasChurch = user.churches?.some(
          (church) =>
            church.ChurchName.toLowerCase().replace(/\s+/g, "-") === churchname
        );
        if (hasChurch) {
          setIsRedirecting(false);
        } else if (pathname !== "/") {
          router.replace("/");
        } else {
          setIsRedirecting(false);
        }
      } else if (pathname !== "/") {
        router.replace("/");
      } else {
        setIsRedirecting(false);
      }
    }
  }, [user, pathname, router, churchname]);

  // Show loading state if user is not loaded or redirecting
  if (!user || isRedirecting) {
    return <Loading />;
  }

  // Full-screen layout without navigation sidebar for form builder
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full h-screen">{children}</main>
    </div>
  );
};

export default ConfigureLayout;
