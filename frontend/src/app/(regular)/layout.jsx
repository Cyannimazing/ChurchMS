"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/auth.jsx";
import Loading from "@/components/Loading.jsx";
import Navigation from "./Navigation";
import { initializeEcho } from "@/lib/echo";

const AppLayout = ({ children }) => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    if (user) {
      // Check email verification first
      if (!user.email_verified_at) {
        router.push("/verify-email");
        return;
      }
      
      // Initialize Echo for real-time notifications
      initializeEcho();
      
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
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      <main className="lg:ml-72 transition-all duration-300">{children}</main>
    </div>
  );
};

export default AppLayout;
