"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/auth.jsx";
import Navigation from "@/app/(church)/Navigation.jsx";
import Loading from "@/components/Loading.jsx";
import axios from "@/lib/axios";

// Define paths that are allowed without an active subscription
const ALLOWED_PATHS_FOR_CHURCH_OWNER = [
  "/subscriptions",
  "/plans",
  "/logout", // or your logout path
];

const AppLayout = ({ children }) => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const pathname = usePathname();

  const [isRedirecting, setIsRedirecting] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Check email verification first
    if (!user.email_verified_at) {
      router.push("/verify-email");
      return;
    }

    const roleId = user.profile.system_role_id;

    if (roleId === 2) {
      // Church Owner role
      // If already on an allowed path, don't check subscription
      if (
        ALLOWED_PATHS_FOR_CHURCH_OWNER.some((path) => pathname.startsWith(path))
      ) {
        setIsRedirecting(false);
        return;
      }

      axios
        .get("/api/church-subscriptions")
        .then((response) => {
          const activeSub = response.data.active;
          const hasSub = !!activeSub;
          setHasActiveSubscription(hasSub);

          if (!hasSub && !ALLOWED_PATHS_FOR_CHURCH_OWNER.includes(pathname)) {
            router.replace("/subscriptions");
          } else {
            setIsRedirecting(false);
          }
        })
        .catch(() => {
          setHasActiveSubscription(false);
          if (!ALLOWED_PATHS_FOR_CHURCH_OWNER.includes(pathname)) {
            router.replace("/subscriptions");
          }
        });
    } else {
      // For non-Church Owners, ensure they're on the root path
      if (pathname !== "/") {
        router.replace("/");
      } else {
        setIsRedirecting(false);
      }
    }
  }, [user, pathname, router]);

  if (
    !user ||
    isRedirecting ||
    (user?.profile?.system_role_id === 2 &&
      hasActiveSubscription === false &&
      !ALLOWED_PATHS_FOR_CHURCH_OWNER.some((path) => pathname.startsWith(path)))
  ) {
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
