"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/auth";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  ChurchIcon,
  Lock,
  Mail,
  MapPin,
  NotebookTabsIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/Button";
import Input from "@/components/Input";
import Label from "@/components/Label";
import InputError from "@/components/InputError";

const RegisterForm = () => {
  const { register } = useAuth({
    middleware: "guest",
    redirectIfAuthenticated: "/dashboard",
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showRoleModal, setShowRoleModal] = useState(true);
  const [roleId, setRoleId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirmation: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    address: "",
    contact_number: "",
    payment_method: "",
    // Address components
    street_address: "",
    city: "",
    postal_code: "",
  });
  const [errors, setErrors] = useState({});

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};
    if (!roleId) {
      newErrors.role_id = ["Please select a role"];
    } else if (!["1", "2"].includes(roleId)) {
      newErrors.role_id = ["Invalid role selected"];
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (formData.first_name && formData.first_name.length > 100) {
      newErrors.first_name = ["First name must not exceed 100 characters"];
    }
    if (formData.middle_name && formData.middle_name.length > 1) {
      newErrors.middle_name = ["Middle initial must be 1 character"];
    }
    if (formData.last_name && formData.last_name.length > 100) {
      newErrors.last_name = ["Last name must not exceed 100 characters"];
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (formData.address && formData.address.length > 255) {
      newErrors.address = ["Address must not exceed 255 characters"];
    }
    if (formData.contact_number && formData.contact_number.length > 20) {
      newErrors.contact_number = [
        "Contact number must not exceed 20 characters",
      ];
    }
    if (
      formData.contact_number &&
      !/^\+?\d{0,20}$/.test(formData.contact_number)
    ) {
      newErrors.contact_number = [
        "Contact number must be a valid phone number",
      ];
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = ["Email is required"];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = ["Please enter a valid email address"];
    } else if (formData.email.length > 255) {
      newErrors.email = ["Email must not exceed 255 characters"];
    }
    if (!formData.password) {
      newErrors.password = ["Password is required"];
    } else if (formData.password.length < 8) {
      newErrors.password = ["Password must be at least 8 characters"];
    }
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = ["Password confirmation is required"];
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = ["Passwords do not match"];
    }
    // Subscription plan and payment method validation removed - auto-assigned free plan for church owners
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Load roleId and planId from URL query params
  useEffect(() => {
    const role = searchParams.get("roleId");
    const plan = searchParams.get("planId");
    if (role) {
      setRoleId(role);
      setShowRoleModal(false);
    }
    if (plan) setSelectedPlan(plan);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors for the field being edited
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const concatenateAddress = () => {
    const addressParts = [
      formData.street_address,
      formData.city,
      "Davao City, Philippines",
      formData.postal_code
    ].filter(part => part && part.trim() !== '');
    
    return addressParts.join(', ');
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});

    const requestData = {
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      first_name: formData.first_name,
      middle_name: formData.middle_name,
      last_name: formData.last_name,
      address: concatenateAddress(),
      contact_number: formData.contact_number,
      role_id: roleId,
    };
    
    try {
      await register({
        ...requestData,
        setErrors,
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({
          general: [error.response?.data?.message || "Registration failed."],
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role) => {
    setRoleId(role);
    setShowRoleModal(false);
  };


  return (
    <>
      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideLeft {
          from {
            opacity: 0;
            transform: translateX(-100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-down {
          animation: slideDown 0.5s ease-out;
        }
        .animate-slide-left {
          animation: slideLeft 0.8s ease-out;
        }
        .animate-slide-right {
          animation: slideRight 0.8s ease-out;
        }
      `}</style>

      {/* Background Image - Always visible */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/heroo.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-slide-down">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
              Choose Your Role
            </h2>
            <p className="text-center text-gray-600 mb-6">Select how you want to use FaithSeeker</p>
            <div className="space-y-4">
              <button
                onClick={() => handleRoleSelect("1")}
                className="w-full p-6 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 text-left group cursor-pointer"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Seeker</h3>
                    <p className="text-sm text-gray-600">Find and engage with churches</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleRoleSelect("2")}
                className="w-full p-6 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 text-left group cursor-pointer"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-full flex items-center justify-center mr-4">
                    <ChurchIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Church Owner</h3>
                    <p className="text-sm text-gray-600">Manage your church services</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form */}
      {!showRoleModal && (
        <div className="min-h-screen flex items-center justify-center relative py-12">
          {/* Two Column Layout */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left Column - Welcome Section */}
              <div className="text-white space-y-6 animate-slide-left">
                <h1 className="text-5xl sm:text-6xl font-bold">
                  Join<br />FaithSeeker
                </h1>
                <p className="text-lg text-gray-200 max-w-md">
                  {roleId === "1" ? "Create your account to discover and connect with churches in your community." : "Start managing your church's services and engaging with your community today."}
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                </div>
              </div>

              {/* Right Column - Registration Form */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 space-y-4 animate-slide-right">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Create Account
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {roleId === "1" ? "Register as a Seeker" : "Register as a Church Owner"}
                  </p>
                </div>

                <form onSubmit={submitForm} className="space-y-3">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                        First Name
                      </Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                        placeholder="Juan"
                        required
                      />
                      <InputError messages={errors.first_name} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                        Last Name
                      </Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                        placeholder="Dela Cruz"
                        required
                      />
                      <InputError messages={errors.last_name} className="mt-1" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="middle_name" className="text-sm font-medium text-gray-700">
                      Middle Initial (Optional)
                    </Label>
                    <Input
                      id="middle_name"
                      name="middle_name"
                      type="text"
                      maxLength={1}
                      value={formData.middle_name}
                      onChange={handleChange}
                      className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                      placeholder="P"
                    />
                    <InputError messages={errors.middle_name} className="mt-1" />
                  </div>

                  {/* Address */}
                  <div>
                    <Label htmlFor="street_address" className="text-sm font-medium text-gray-700">
                      Street Address
                    </Label>
                    <Input
                      id="street_address"
                      name="street_address"
                      type="text"
                      value={formData.street_address}
                      onChange={handleChange}
                      className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                      placeholder="123 Main St, Apt 4B"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                        District/Area
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleChange}
                        className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                        placeholder="Poblacion District"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postal_code" className="text-sm font-medium text-gray-700">
                        Postal Code
                      </Label>
                      <Input
                        id="postal_code"
                        name="postal_code"
                        type="text"
                        value={formData.postal_code}
                        onChange={handleChange}
                        className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                        placeholder="8000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contact_number" className="text-sm font-medium text-gray-700">
                      Contact Number
                    </Label>
                    <Input
                      id="contact_number"
                      name="contact_number"
                      type="tel"
                      value={formData.contact_number}
                      onChange={handleChange}
                      className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                      placeholder="+63 912 345 6789"
                    />
                    <InputError messages={errors.contact_number} className="mt-1" />
                  </div>

                  {/* Account */}
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                      placeholder="juan.delacruz@gmail.com"
                      required
                    />
                    <InputError messages={errors.email} className="mt-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                        placeholder="Enter password"
                        required
                        autoComplete="new-password"
                      />
                      <InputError messages={errors.password} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">
                        Confirm Password
                      </Label>
                      <Input
                        id="password_confirmation"
                        name="password_confirmation"
                        type="password"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        className="block mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                        placeholder="Confirm password"
                        required
                      />
                      <InputError messages={errors.password_confirmation} className="mt-1" />
                    </div>
                  </div>

                  {errors.general && (
                    <div className="text-red-600 text-sm text-center">
                      {errors.general[0]}
                    </div>
                  )}

                  {/* Register Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  {/* Terms */}
                  <p className="text-xs text-center text-gray-500">
                    By creating an account, you agree to{' '}
                    <Link href="#" className="text-indigo-600 hover:underline">Terms of Service</Link>
                    {' '}|{' '}
                    <Link href="#" className="text-indigo-600 hover:underline">Privacy Policy</Link>
                  </p>
                </form>

                {/* Sign In Link */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const RegisterPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
      <RegisterForm />
    </Suspense>
  );
};

export default RegisterPage;
