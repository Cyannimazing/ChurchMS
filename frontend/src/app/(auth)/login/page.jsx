"use client";

import Button from "@/components/Button.jsx";
import Input from "@/components/Input.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import Link from "next/link";
import { useAuth } from "@/hooks/auth.jsx";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthSessionStatus from "../AuthSessionStatus";
import { Mail, Lock } from "lucide-react";

const Login = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { login } = useAuth({
    middleware: "guest",
    redirectIfAuthenticated: "/",
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shouldRemember, setShouldRemember] = useState(false);
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (router.reset?.length > 0 && errors.length === 0) {
      setStatus(atob(router.reset));
    } else if (searchParams.get('verified') === '1') {
      setStatus('Email verified successfully! Please login to continue.');
    } else {
      setStatus(null);
    }
  }, [router.reset, errors.length, searchParams]);

  const submitForm = async (event) => {
    event.preventDefault();

    await login({
      email,
      password,
      remember: shouldRemember,
      setErrors,
      setStatus,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8 transform transition-all duration-300 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          Sign In to Your Account
        </h2>
        <AuthSessionStatus className="mb-4 text-center" status={status} />
        <form onSubmit={submitForm} className="space-y-6">
          {/* Email Address */}
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                className="block mt-1 w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-all duration-200"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="juan.delacruz@gmail.com..."
                required
                autoFocus
              />
            </div>
            <InputError messages={errors.email} className="mt-2" />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={password}
                className="block mt-1 w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-all duration-200"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password@123..."
                required
                autoComplete="current-password"
              />
            </div>
            <InputError messages={errors.password} className="mt-2" />
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="remember_me"
              type="checkbox"
              name="remember"
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              onChange={(event) => setShouldRemember(event.target.checked)}
            />
            <label htmlFor="remember_me" className="ml-2 text-sm text-gray-600">
              Remember me
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between">
            <Link
              href="/forgot-password"
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Forgot your password?
            </Link>
            <Button type="submit" variant="primary" className="">
              Sign In
            </Button>
          </div>
        </form>
        <div className="text-center">
          <Link
            href="/register"
            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Don't have an account? Sign up
          </Link>
        </div>
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

export default Login;
