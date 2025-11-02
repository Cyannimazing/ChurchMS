"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/auth.jsx";
import ApplicationLogo from "@/components/ApplicationLogo.jsx";
import { Menu, X, Church } from "lucide-react";
import axios from "@/lib/axios";
import { getEcho } from "@/lib/echo";

// Lightweight sound player for new notifications (sidebar only)
let __navNotifAudio;
const playNavNotificationSound = () => {
  try {
    if (!__navNotifAudio) {
      __navNotifAudio = new Audio('/notification-sound.mp3');
      __navNotifAudio.preload = 'auto';
    }
    __navNotifAudio.currentTime = 0;
    const p = __navNotifAudio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch (_) {}
};

const Navigation = ({ user }) => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { churchname } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Fetch unread count + realtime + fallbacks
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get('/api/notifications/unread-count');
        setUnreadCount(response.data.count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    if (!user) return;

    // Initial fetch
    fetchUnreadCount();

    // WebSocket realtime updates
    const echo = getEcho();
    let userChannel;
    if (echo) {
      userChannel = echo.private(`user.${user.id}`);
      const refresh = () => fetchUnreadCount();
      userChannel.listen('.notification.created', () => {
        refresh();
        try {
          if (!pathname.endsWith('/notifications')) playNavNotificationSound();
        } catch (_) {}
      });
      userChannel.listen('.notification.read', refresh);
      userChannel.listen('.notification.read_all', refresh);
      userChannel.listen('.notification.deleted', refresh);
    }

    // Polling fallback every 10s (covers missed events / reconnections)
    const intervalId = setInterval(fetchUnreadCount, 10000);

    // Update on tab focus/visibility
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchUnreadCount(); };
    const handleFocus = () => fetchUnreadCount();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      try {
        if (userChannel) {
          userChannel.stopListening('.notification.created');
          userChannel.stopListening('.notification.read');
          userChannel.stopListening('.notification.read_all');
          userChannel.stopListening('.notification.deleted');
        }
      } catch (_) {}
    };
  }, [user, pathname]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
      if (window.innerWidth >= 1024) {
        setIsOpen(true); // Sidebar always open at lg and above
      } else {
        setIsOpen(false); // Sidebar closed by default on mobile
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavClick = () => {
    if (isMobile) setIsOpen(false); // Close sidebar on link click in mobile view
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const menuSections = [
    {
      title: "Main Menu",
      items: [
        {
          name: "Dashboard",
          href: `/${churchname}/dashboard`,
          icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
          badge: null,
        },
        {
          name: "Appointment",
          href: `/${churchname}/appointment`,
          icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
          badge: null,
          permission: "appointment_list",
        },
        {
          name: "Transaction Record",
          href: `/${churchname}/transaction-record`,
          icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
          badge: null,
          permission: "transaction_list",
        },
        {
          name: "Notifications",
          href: `/${churchname}/notifications`,
          icon: "M15 17h5l-1.405-1.405C18.79 14.79 18 13.42 18 12V8a6 6 0 10-12 0v4c0 1.42-.79 2.79-2.595 3.595L2 17h5m8 0a3 3 0 11-6 0 3 3 0 016 0z",
          badge: "dynamic",
        },
      ],
    },
    {
      title: "Entry Control",
      items: [
        {
          name: "Role",
          href: `/${churchname}/role`,
          icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
          badge: null,
          permission: "role_list",
        },
        {
          name: "Employee",
          href: `/${churchname}/employee`,
          icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197H9m6 0v-1a6 6 0 00-3-5.197m0 0V9a3 3 0 00-6 0v5.197",
          badge: null,
          permission: "employee_list",
        },
        {
          name: "Service",
          href: `/${churchname}/service`,
          icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
          badge: null,
          permission: "service_list",
        },
        {
          name: "Schedule",
          href: `/${churchname}/schedule`,
          icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
          badge: null,
          permission: "schedule_list",
        },
        {
          name: "Signature",
          href: `/${churchname}/signature`,
          icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
          badge: null,
          permission: "signature_list",
        },
      ],
    },
    {
      title: "Member Management",
      items: [
        {
          name: "Member Applications",
          href: `/${churchname}/member-applications`,
          icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
          badge: null,
          permission: "member-application_list",
        },
        {
          name: "Member Directory",
          href: `/${churchname}/member-directory`,
          icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
          badge: null,
          permission: "member-directory_list",
        },
      ],
    },
    {
      title: "Certificate Management",
      items: [
        {
          name: "Certificate Config",
          href: `/${churchname}/certificate-config`,
          icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
          badge: null,
          permission: "certificate-config_list",
        }
      ],
    },
  ];

  // Get church name based on user role
  const getChurchName = () => {
    if (user?.profile?.system_role?.role_name === "ChurchStaff") {
      return user?.church?.ChurchName || "Church Staff";
    } else if (user?.profile?.system_role?.role_name === "ChurchOwner") {
      // For church owner, find the church by matching the churchname parameter
      const currentChurch = user?.churches?.find(
        (church) => church.ChurchName.toLowerCase().replace(/\s+/g, "-") === churchname
      );
      return currentChurch?.ChurchName || "Church Management";
    }
    return "Church Management";
  };

  const filteredMenuSections = menuSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (user?.profile?.system_role?.role_name === "ChurchOwner") {
        return true;
      }
      return (
        !item.permission ||
        user?.church_role?.permissions?.some(
          (perm) => perm.PermissionName === item.permission
        )
      );
    }),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      {/* Top Navigation Bar - Only on mobile (<1024px) */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg h-16 flex items-center justify-between px-4">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? (
                <X size={24} className="text-gray-800" />
              ) : (
                <Menu size={24} className="text-gray-800" />
              )}
            </button>
          </div>

          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center p-2 rounded-lg"
            >
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full flex items-center justify-center font-medium bg-slate-100 text-slate-700">
                  {user?.profile.first_name?.charAt(0) || "U"}
                </div>
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 rounded-lg shadow-lg overflow-hidden z-50 bg-white w-48">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs text-gray-500">
                    Signed in as{" "}
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => {
                      handleNavClick();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-indigo-600"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Your Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center cursor-pointer w-full px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-red-600"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white drop-shadow-lg transition-transform duration-300 ease-in-out ${
          isMobile
            ? isOpen
              ? "translate-x-0 w-72"
              : "-translate-x-full w-72"
            : "translate-x-0 w-72"
        } ${isMobile ? "mt-16" : "mt-0"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className="bg-white border-b border-gray-100 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 rounded-xl p-2.5">
                <ApplicationLogo className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {getChurchName()}
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Management System
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <div className="space-y-6">
              {filteredMenuSections.map((section, sectionIndex) => (
                <div key={section.title}>
                  {/* Section Title */}
                  <div className="px-4 mb-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </div>
                  
                  {/* Section Items */}
                  <ul className="space-y-1">
                    {section.items.map((item, itemIndex) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={handleNavClick}
                          className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                            pathname === item.href
                              ? "bg-slate-100 text-slate-900 font-medium"
                              : "text-gray-700 hover:bg-gray-50 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center">
                            <svg
                              className="w-5 h-5 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={item.icon}
                              />
                            </svg>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          {item.badge === "dynamic" && unreadCount > 0 && pathname !== item.href && (
                            <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              {unreadCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Divider between sections (except for the last section) */}
                  {sectionIndex < filteredMenuSections.length - 1 && (
                    <div className="mx-4 mt-6 border-t border-gray-200"></div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* User Profile - Only at lg and above */}
          {!isMobile && (
            <div className="px-4 py-4 border-t border-gray-100">
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center w-full p-2 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center font-medium bg-slate-100 text-slate-700">
                      {user?.profile.first_name?.charAt(0) || "U"}
                    </div>
                  </div>
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.profile.first_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.profile.system_role.role_name}
                    </p>
                  </div>
                  <svg
                    className={`ml-auto h-5 w-5 text-gray-400 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 rounded-lg shadow-lg overflow-hidden z-50 bg-white">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs text-gray-500">
                        Signed in as{" "}
                        <span className="font-medium">{user?.email}</span>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => {
                          handleNavClick();
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-indigo-600"
                      >
                        <svg
                          className="w-5 h-5 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Your Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center cursor-pointer w-full px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-red-600"
                      >
                        <svg
                          className="w-5 h-5 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
      {/* Overlay - Only on mobile when sidebar is open */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Navigation;
