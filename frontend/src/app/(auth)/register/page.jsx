"use client";

import { useState, useEffect, Suspense } from "react";
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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/Button";

const RegisterForm = () => {
  const { register } = useAuth({
    middleware: "guest",
    redirectIfAuthenticated: "/dashboard",
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
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
    if (role) setRoleId(role);
    if (plan) setSelectedPlan(plan);
    if (role === "2" && plan) setStep(2);
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
    if (!validateStep4()) return;

    setIsLoading(true); // Start loading
    setErrors({}); // Clear any previous errors

    const requestData = {
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      first_name: formData.first_name,
      middle_name: formData.middle_name,
      last_name: formData.last_name,
      address: concatenateAddress(), // Use concatenated address
      contact_number: formData.contact_number,
      role_id: roleId,
      // Subscription plan and payment method removed - auto-assigned on backend
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
    } finally {
      setIsLoading(false); // Stop loading regardless of success or failure
    }
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;

    if (step === 1) {
      // Both Seekers and Church Owners proceed to step 2
      // Church Owners get free plan automatically, no pricing selection needed
      setSelectedPlan(null);
      router.push("/register");
      setStep(2);
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
                    placeholder="Enter first name..."
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
                    placeholder="Enter middle initial... (OPTIONAL)"
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
                    placeholder="Enter last name..."
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
                  htmlFor="street_address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Street Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="street_address"
                    name="street_address"
                    type="text"
                    placeholder="123 Main Street, Apt 4B..."
                    value={formData.street_address}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700"
                  >
                    District/Area in Davao City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="Poblacion District, Buhangin District..."
                      value={formData.city}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-all duration-200"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Popular areas: Poblacion, Buhangin, Tugbok, Agdao, Toril, Calinan, Marilog, Talomo
                  </p>
                </div>
                
                <div>
                  <label
                    htmlFor="postal_code"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Postal Code
                  </label>
                  <input
                    id="postal_code"
                    name="postal_code"
                    type="text"
                    placeholder="8000..."
                    value={formData.postal_code}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-all duration-200"
                  />
                </div>
              </div>
              
              {/* Address Preview */}
              {(formData.street_address || formData.city) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Preview:
                  </label>
                  <p className="text-sm text-gray-600">
                    {concatenateAddress() || "Enter address details above"}
                  </p>
                </div>
              )}
              
              {errors.address && (
                <div className="text-red-600 text-sm mt-1">
                  {errors.address[0]}
                </div>
              )}
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
                    placeholder="+63 912 345 6789..."
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
                    placeholder="juan.delacruz@gmail.com..."
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
                    placeholder="Password@123..."
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
                    placeholder="Password@123..."
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
              
              {/* Free plan message for Church Owners */}
              {roleId === "2" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-green-800">Free Trial Included!</h4>
                      <p className="text-sm text-green-700">You'll automatically receive a 1-month free trial to get started with your church management.</p>
                    </div>
                  </div>
                </div>
              )}
              
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
                    isLoading ||
                    !(
                      formData.email &&
                      formData.password &&
                      formData.password_confirmation &&
                      formData.password === formData.password_confirmation
                    )
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
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

const RegisterPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
      <RegisterForm />
    </Suspense>
  );
};

export default RegisterPage;
