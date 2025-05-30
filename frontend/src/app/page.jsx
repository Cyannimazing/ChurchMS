"use client";

import Image from "next/image";
import Link from "next/link";
import HomeSection from "@/components/sections/homesection";
import LoginLinks from "./LoginLinks";
import { Roboto } from 'next/font/google';
import { useState } from 'react';

const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const Home = () => {
  // State for dropdowns and mobile menu
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <div className={roboto.className}>
      <main>
        <nav className="bg-white fixed top-0 w-full z-50 shadow-md">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                <Image
                  src="/images/Churchlogo.png"
                  alt="FaithSeeker logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
                <span className="self-center text-2xl font-semibold whitespace-nowrap text-black">
                  FaithSeeker
                </span>
              </Link>

              {/* Desktop Menu */}
              <div className="hidden md:flex md:items-center md:justify-center flex-1">
                <ul className="flex flex-row space-x-8 font-medium">
                  <li>
                    <Link
                      href="#home"
                      className="block py-2 px-3 text-black rounded-sm hover:bg-gray-200 md:hover:bg-transparent md:border-0"
                      aria-current="page"
                      onClick={handleLinkClick}
                    >
                      Home
                    </Link>
                  </li>
                  <li className="relative">
                    <button
                      onClick={() => toggleDropdown('platform')}
                      className="flex items-center justify-between py-2 px-3 text-black hover:bg-gray-200 md:hover:bg-transparent md:border-0"
                    >
                      Platform
                      <svg
                        className={`w-2.5 h-2.5 ml-2.5 transform transition-transform ${openDropdown === 'platform' ? 'rotate-180' : ''}`}
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
                      className={`z-50 ${openDropdown === 'platform' ? 'block' : 'hidden'} bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-44 absolute left-0 mt-2`}
                    >
                      <ul className="py-2 text-sm text-gray-700">
                        <li>
                          <Link href="/platform#features" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                            Features
                          </Link>
                        </li>
                        <li>
                          <Link href="/platform#howitworks" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                            How It Works
                          </Link>
                        </li>
                        <li>
                          <Link href="/platform#forchurches" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                            For Churches
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </li>
                  <li className="relative">
                    <button
                      onClick={() => toggleDropdown('company')}
                      className="flex items-center justify-between py-2 px-3 text-black hover:bg-gray-200 md:hover:bg-transparent md:border-0"
                    >
                      Company
                      <svg
                        className={`w-2.5 h-2.5 ml-2.5 transform transition-transform ${openDropdown === 'company' ? 'rotate-180' : ''}`}
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
                      className={`z-50 ${openDropdown === 'company' ? 'block' : 'hidden'} bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-44 absolute left-0 mt-2`}
                    >
                      <ul className="py-2 text-sm text-gray-700">
                        <li>
                          <Link href="/company#about" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                            About
                          </Link>
                        </li>
                        <li>
                          <Link href="/company#faq" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                            FAQ
                          </Link>
                        </li>
                        <li>
                          <Link href="/company#testimonials" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                            Testimonials
                          </Link>
                        </li>
                        <li>
                          <Link href="/company#contact" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                            Contact
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </li>
                  <li className="relative">
                    <button
                      onClick={() => toggleDropdown('support')}
                      className="flex items-center justify-between py-2 px-3 text-black hover:bg-gray-200 md:hover:bg-transparent md:border-0"
                    >
                      Support
                      <svg
                        className={`w-2.5 h-2.5 ml-2.5 transform transition-transform ${openDropdown === 'support' ? 'rotate-180' : ''}`}
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
                      className={`z-50 ${openDropdown === 'support' ? 'block' : 'hidden'} bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-44 absolute left-0 mt-2`}
                    >
                      <ul className="py-2 text-sm text-gray-700">
                        <li>
                          <Link href="/support#pricing" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                            Pricing
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Login Links and Hamburger Menu */}
              <div className="flex items-center space-x-4">
                <LoginLinks />
                <button
                  type="button"
                  className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-black rounded-lg md:hidden hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
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
              </div>
            </div>

            {/* Mobile Menu */}
            <div
              className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} bg-white border border-gray-700 rounded-lg mt-2`}
              id="navbar-multi-level"
            >
              <ul className="flex flex-col font-medium p-4">
                <li>
                  <Link
                    href="#home"
                    className="block py-2 px-3 text-black rounded-sm hover:bg-gray-200"
                    onClick={handleLinkClick}
                  >
                    Home
                  </Link>
                </li>
                <li className="relative">
                  <button
                    onClick={() => toggleDropdown('platform')}
                    className="flex items-center justify-between w-full py-2 px-3 text-black hover:bg-gray-200"
                  >
                    Platform
                    <svg
                      className={`w-2.5 h-2.5 ml-2.5 transform transition-transform ${openDropdown === 'platform' ? 'rotate-180' : ''}`}
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
                    className={`${openDropdown === 'platform' ? 'block' : 'hidden'} bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-full mt-2`}
                  >
                    <ul className="py-2 text-sm text-gray-700">
                      <li>
                        <Link href="#features" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                          Features
                        </Link>
                      </li>
                      <li>
                        <Link href="#howitworks" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                          How It Works
                        </Link>
                      </li>
                      <li>
                        <Link href="#forchurches" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                          For Churches
                        </Link>
                      </li>
                    </ul>
                  </div>
                </li>
                <li className="relative">
                  <button
                    onClick={() => toggleDropdown('company')}
                    className="flex items-center justify-between w-full py-2 px-3 text-black hover:bg-gray-200"
                  >
                    Company
                    <svg
                      className={`w-2.5 h-2.5 ml-2.5 transform transition-transform ${openDropdown === 'company' ? 'rotate-180' : ''}`}
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
                    className={`${openDropdown === 'company' ? 'block' : 'hidden'} bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-full mt-2`}
                  >
                    <ul className="py-2 text-sm text-gray-700">
                      <li>
                        <Link href="#about" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                          About
                        </Link>
                      </li>
                      <li>
                        <Link href="#faq" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                          FAQ
                        </Link>
                      </li>
                      <li>
                        <Link href="#testimonials" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                          Testimonials
                        </Link>
                      </li>
                      <li>
                        <Link href="#contact" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                          Contact
                        </Link>
                      </li>
                    </ul>
                  </div>
                </li>
                <li className="relative">
                  <button
                    onClick={() => toggleDropdown('support')}
                    className="flex items-center justify-between w-full py-2 px-3 text-black hover:bg-gray-200"
                  >
                    Support
                    <svg
                      className={`w-2.5 h-2.5 ml-2.5 transform transition-transform ${openDropdown === 'support' ? 'rotate-180' : ''}`}
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
                    className={`${openDropdown === 'support' ? 'block' : 'hidden'} bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-full mt-2`}
                  >
                    <ul className="py-2 text-sm text-gray-700">
                      <li>
                        <Link href="#pricing" className="block px-4 py-2 hover:bg-gray-100" onClick={handleLinkClick}>
                          Pricing
                        </Link>
                      </li>
                    </ul>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Add padding to prevent content from being hidden under fixed navbar */}
        <div className="pt-16">
          <section id="home">
            <HomeSection />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;