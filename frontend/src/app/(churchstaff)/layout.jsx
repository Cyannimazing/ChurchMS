"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useAuth } from "@/hooks/auth.jsx";
import axios from "@/lib/axios";
import Loading from "@/components/Loading.jsx";
import Navigation from "./Navigation";
import { initializeEcho } from "@/lib/echo";
import { AlertTriangle } from "lucide-react";
import Button from "@/components/Button";

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const { churchname } = useParams();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [churchStatus, setChurchStatus] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(null);
  const [deactivatedAlert, setDeactivatedAlert] = useState(false);

  // Check church status and subscription
  useEffect(() => {
    const checkChurchAccess = async () => {
      if (!user || !churchname) return;

      try {
        // Fetch churches for the owner
        if (user.profile.system_role.role_name === "ChurchOwner") {
          const churchesResponse = await axios.get("/api/churches/owned");
          const church = churchesResponse.data.churches.find(
            (c) => c.ChurchName.toLowerCase().replace(/\s+/g, "-") === churchname
          );

          if (church) {
            setChurchStatus(church.ChurchStatus);

            // Check subscription
            const subscriptionResponse = await axios.get("/api/church-subscriptions");
            setHasActiveSubscription(
              subscriptionResponse.data.active !== null
            );

            // Redirect if church is disabled or no active subscription
            if (church.ChurchStatus === "Disabled" || !subscriptionResponse.data.active) {
              router.push("/church");
              return;
            }
          }
        } else if (user.profile.system_role.role_name === "ChurchStaff") {
          // Check church status and subscription for staff
          const churchResponse = await axios.get(`/api/churches-and-roles/${churchname}`);
          const church = churchResponse.data;

          if (church) {
            setChurchStatus(church.ChurchStatus);
            setHasActiveSubscription(church.has_active_subscription);

            // Redirect if church is disabled or owner has no active subscription
            if (church.ChurchStatus === "Disabled" || !church.has_active_subscription) {
              router.push("/");
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error checking church access:", error);
      }
    };

    checkChurchAccess();
  }, [user, churchname, router]);

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

      if (role === "ChurchStaff") {
        // Check if church staff account is deactivated
        if (user.user_church_role && user.user_church_role.is_active === false) {
          setDeactivatedAlert(true);
          setIsRedirecting(false);
          return;
        }

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
  if (!user || (isRedirecting && !deactivatedAlert)) {
    return <Loading />;
  }

  // Show deactivated alert with logout option
  if (deactivatedAlert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200 text-yellow-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium">
                  Account Deactivated
                </h3>
                <div className="text-sm mt-1">
                  Your church staff account has been deactivated. You no longer have access to this church's management system.
                </div>
                <div className="mt-4">
                  <Button
                    onClick={() => logout()}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-600"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      <main className="lg:ml-72 transition-all duration-300">{children}</main>
    </div>
  );
};

export default AppLayout;
