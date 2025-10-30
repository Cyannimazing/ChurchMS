"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/auth.jsx";
import ApplicationLogo from "@/components/ApplicationLogo.jsx";
import { Menu, X } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
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
        try { if (!pathname.endsWith('/notifications')) playNavNotificationSound(); } catch (_) {}
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

  const toggleSubmenu = (index) => {
    setActiveSubmenu(activeSubmenu === index ? null : index);
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
          href: "/dashboard",
          icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
          badge: null,
        },
        {
          name: "Appointment",
          href: "/appointment",
          icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
          badge: null,
        },
        {
          name: "Notifications",
          href: "/notifications",
          icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
          badge: "dynamic", // Will be replaced with actual count
        },
      ],
    },
  ];

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

          {/* User Profile in Top Bar */}
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

            {/* Dropdown - Triggered by click */}
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
                      setIsDropdownOpen(false); // Close dropdown on link click
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
                  <Link
                    href="/settings"
                    onClick={() => {
                      handleNavClick();
                      setIsDropdownOpen(false); // Close dropdown on link click
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsDropdownOpen(false); // Close dropdown on logout
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
                  User Dashboard
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
              {menuSections.map((section, sectionIndex) => (
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
                  {sectionIndex < menuSections.length - 1 && (
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

                {/* Dropdown - Triggered by click */}
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
                          setIsDropdownOpen(false); // Close dropdown on link click
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
                      <Link
                        href="/settings"
                        onClick={() => {
                          handleNavClick();
                          setIsDropdownOpen(false); // Close dropdown on link click
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
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false); // Close dropdown on logout
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
