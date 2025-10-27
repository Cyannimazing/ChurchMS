"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import LoginLinks from "@/components/LoginLinks";
import ApplicationLogo from "@/components/ApplicationLogo";

const Navigation = () => {
  // State for dropdowns and mobile menu
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Toggle dropdown visibility
  const toggleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setOpenDropdown(null); // Close any open dropdowns
  };

  // Close dropdowns and mobile menu when clicking a link
  const handleLinkClick = () => {
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
  };

  // Handle window resize to determine layout and close mobile menu on desktop
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024; // Custom breakpoint at 1024px
      setIsDesktop(desktop);
      if (desktop) {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
      }
    };

    // Add event listener
    window.addEventListener("resize", handleResize);
    // Initial check
    handleResize();

    // Cleanup event listener
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav className="bg-white/95 backdrop-blur-sm fixed top-0 w-full z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-end"
            onClick={handleLinkClick}
          >
            <ApplicationLogo className="h-8 w-8 text-indigo-600 mb-0.5" />
            <span className="text-2xl font-semibold tracking-tight leading-none">
              <span className="text-gray-900">Faith</span><span className="text-indigo-600">Seeker</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:items-center lg:space-x-8 flex-1 justify-end">
            <ul className="flex flex-row space-x-1 font-medium">
              <li>
                <Link
                  href="/"
                  className="block py-2 px-4 text-gray-700 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  aria-current="page"
                  onClick={handleLinkClick}
                >
                  Home
                </Link>
              </li>
              <li className="relative">
                <button
                  onClick={() => toggleDropdown("platform")}
                  className="flex items-center justify-between py-2 px-4 text-gray-700 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  Platform
                  <svg
                    className={`w-2.5 h-2.5 ml-2.5 transform transition-transform ${
                      openDropdown === "platform" ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                <div
                  className={`z-50 ${
                    openDropdown === "platform" ? "block" : "hidden"
                  } bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-44 absolute left-0 mt-2`}
                >
                  <ul className="py-2 text-sm text-gray-700">
                    <li>
                      <Link
                        href="/platform#features"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        Features
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/platform#how_it_work"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        How It Works
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/platform#for_churches"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        For Churches
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="relative">
                <button
                  onClick={() => toggleDropdown("company")}
                  className="flex items-center justify-between py-2 px-4 text-gray-700 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  Company
                  <svg
                    className={`w-2.5 h-2.5 ml-2.5 transform transition-transform ${
                      openDropdown === "company" ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                <div
                  className={`z-50 ${
                    openDropdown === "company" ? "block" : "hidden"
                  } bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-44 absolute left-0 mt-2`}
                >
                  <ul className="py-2 text-sm text-gray-700">
                    <li>
                      <Link
                        href="/company#about"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        About
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/company#faq"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        FAQ
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/company#testimonials"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        Testimonials
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/company#contact"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        Contact
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="block py-2 px-4 text-gray-700 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  onClick={handleLinkClick}
                >
                  Pricing
                </Link>
              </li>
            </ul>
            <div>
              <LoginLinks />
            </div>
          </div>

          {/* Login Links and Hamburger Menu */}
          <div className="flex justify-center items-center space-x-2">
            {!isDesktop && (
              <button
                type="button"
                className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-black rounded-lg lg:hidden hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
                aria-controls="navbar-multi-level"
                aria-expanded={isMobileMenuOpen}
                onClick={toggleMobileMenu}
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="w-5 h-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 17 14"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 1h15M1 7h15M1 13h15"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {!isDesktop && (
          <div
            className={`${
              isMobileMenuOpen ? "block" : "hidden"
            } bg-white border border-gray-700 rounded-lg mt-2`}
            id="navbar-multi-level"
          >
            <ul className="flex flex-col font-medium p-4">
              <li>
                <Link
                  href="/"
                  className="block py-2 px-3 text-black rounded-sm hover:bg-gray-200"
                  onClick={handleLinkClick}
                >
                  Home
                </Link>
              </li>
              <li className="relative">
                <button
                  onClick={() => toggleDropdown("platform")}
                  className="flex items-center justify-between w-full py-2 px-3 text-black hover:bg-gray-200"
                >
                  Platform
                  <svg
                    className={`w-2.5 h-2.5 ml-2.5 transform transition-transform ${
                      openDropdown === "platform" ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                <div
                  className={`${
                    openDropdown === "platform" ? "block" : "hidden"
                  } bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-full mt-2`}
                >
                  <ul className="py-2 text-sm text-gray-700">
                    <li>
                      <Link
                        href="/platform#features"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        Features
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/platform#how_it_work"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        How It Works
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/platform#for_churches"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        For Churches
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="relative">
                <button
                  onClick={() => toggleDropdown("company")}
                  className="flex items-center justify-between w-full py-2 px-3 text-black hover:bg-gray-200"
                >
                  Company
                  <svg
                    className={`w-2.5 h-2.5 ml-2.5 transform transition-transform ${
                      openDropdown === "company" ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                <div
                  className={`${
                    openDropdown === "company" ? "block" : "hidden"
                  } bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-full mt-2`}
                >
                  <ul className="py-2 text-sm text-gray-700">
                    <li>
                      <Link
                        href="/company#about"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        About
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/company#faq"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        FAQ
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/company#testimonials"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        Testimonials
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/company#contact"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        Contact
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="block py-2 px-3 text-black rounded-sm hover:bg-gray-200"
                  onClick={handleLinkClick}
                >
                  Pricing
                </Link>
              </li>
              {/* Mobile Login Links */}
              <LoginLinks mobile handleLinkClick={handleLinkClick} />
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
