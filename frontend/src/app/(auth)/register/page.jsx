"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/auth";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  ChurchIcon,
  Lock,
  Mail,
  MapPin,
  NotebookTabsIcon,
} from "lucide-react";
import { Button } from "@/components/Button";

const RegisterPage = () => {
  const { register } = useAuth({
    middleware: "guest",
    redirectIfAuthenticated: "/dashboard",
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [roleId, setRoleId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirmation: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    address: "",
    contact_number: "",
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
    if (roleId === "2" && !selectedPlan) {
      newErrors.subscription_plan_id = ["Please select a subscription plan"];
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Load roleId and planId from URL query params
  useEffect(() => {
    const role = searchParams.get("roleId");
    const plan = searchParams.get("planId");
    if (role) setRoleId(role);
    if (plan) setSelectedPlan(plan);
    if (role === "2" && plan) setStep(2);
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors for the field being edited
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!validateStep4()) return;

    const requestData = {
      ...formData,
      role_id: roleId,
      subscription_plan_id: roleId === "2" ? selectedPlan : null,
    };
    try {
      await register({
        ...requestData,
        setErrors,
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        setErrors(backendErrors);
        // If email error exists (e.g., email already taken), go back to step 4
        if (backendErrors.email) {
          setStep(4);
        }
      } else {
        setErrors({
          general: [error.response?.data?.message || "Registration failed."],
        });
        setStep(4); // Go back to step 4 for general errors as well
      }
    }
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;

    if (step === 1) {
      if (roleId === "2") {
        // Redirect to pricing for Church Owners
        router.push(`/pricing?roleId=2`);
      } else if (roleId === "1") {
        // Clear query params for Seeker and proceed
        setSelectedPlan(null);
        router.push("/register");
        setStep(2);
      }
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const steps = [
    { id: 1, name: "Role" },
    { id: 2, name: "Personal" },
    { id: 3, name: "Contact" },
    { id: 4, name: "Account" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8 transform transition-all duration-300">
        {/* Progress Indicator */}
        <div className="flex justify-between mb-6">
          {steps.map((s, index) => (
            <div key={s.id} className="flex-1 text-center">
              <div
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= s.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index + 1}
              </div>
              <p className="mt-2 text-xs font-medium text-gray-600">{s.name}</p>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Choose Your Role
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  roleId === "1"
                    ? "border-indigo-500 bg-indigo-100"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setRoleId("1")}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Seeker
                </h3>
                <p className="text-sm text-gray-600">
                  Find and engage with churches in your area.
                </p>
              </div>
              <div
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  roleId === "2"
                    ? "border-indigo-500 bg-indigo-100"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setRoleId("2")}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <ChurchIcon className="w-5 h-5 mr-2" />
                  Church Owner
                </h3>
                <p className="text-sm text-gray-600">
                  Manage your church's online presence and services.
                </p>
              </div>
            </div>
            {errors.role_id && (
              <div className="text-red-600 text-sm text-center">
                {errors.role_id[0]}
              </div>
            )}
            <Button
              onClick={nextStep}
              disabled={!roleId}
              variant="primary"
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Personal Information
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-all duration-200"
                  />
                </div>
                {errors.first_name && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.first_name[0]}
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="middle_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Middle Initial
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="middle_name"
                    name="middle_name"
                    type="text"
                    maxLength={1}
                    value={formData.middle_name}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-all duration-200"
                  />
                </div>
                {errors.middle_name && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.middle_name[0]}
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-all duration-200"
                  />
                </div>
                {errors.last_name && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.last_name[0]}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <Button onClick={prevStep} variant="outline" className="">
                Back
              </Button>
              <Button onClick={nextStep} variant="primary" className="">
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 min-h-[100px] transition-all duration-200"
                  />
                </div>
                {errors.address && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.address[0]}
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="contact_number"
                  className="block text-sm font-medium text-gray-700"
                >
                  Contact Number
                </label>
                <div className="relative">
                  <NotebookTabsIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="contact_number"
                    name="contact_number"
                    type="tel"
                    value={formData.contact_number}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-all duration-200"
                  />
                </div>
                {errors.contact_number && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.contact_number[0]}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <Button onClick={prevStep} variant="outline" className="">
                Back
              </Button>
              <Button onClick={nextStep} variant="primary" className="">
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Create Account
            </h2>
            <form onSubmit={submitForm} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-all duration-200"
                  />
                </div>
                {errors.email && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.email[0]}
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-all duration-200"
                  />
                </div>
                {errors.password && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.password[0]}
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="password_confirmation"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-all duration-200"
                  />
                </div>
                {errors.password_confirmation && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.password_confirmation[0]}
                  </div>
                )}
              </div>
              {errors.subscription_plan_id && (
                <div className="text-red-600 text-sm text-center">
                  {errors.subscription_plan_id[0]}
                </div>
              )}
              {errors.general && (
                <div className="text-red-600 text-sm text-center">
                  {errors.general[0]}
                </div>
              )}
              <div className="flex justify-between">
                <Button onClick={prevStep} variant="outline" className="">
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className=""
                  disabled={
                    !(
                      formData.email &&
                      formData.password &&
                      formData.password_confirmation &&
                      formData.password === formData.password_confirmation &&
                      (roleId === "1" || (roleId === "2" && selectedPlan))
                    )
                  }
                >
                  Complete Registration
                </Button>
              </div>
            </form>
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Already have an account? Log in
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Custom Animation CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
