"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/auth.jsx";
import Loading from "@/components/Loading.jsx";
import Navigation from "./Navigation";

const AppLayout = ({ children }) => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    if (user) {
      const role = user.profile.system_role.role_name;

      if (role === "Regular") {
        setIsRedirecting(false);
      } else if (pathname !== "/") {
        router.replace("/");
      } else {
        setIsRedirecting(false);
      }
    }
  }, [user, pathname, router]);

  // Show loading state if user is not loaded or redirecting
  if (!user || isRedirecting) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation user={user} className="fixed" />
      <main>{children}</main>
    </div>
  );
};

export default AppLayout;
