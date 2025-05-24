"use client";

import Button from "@/components/Button.jsx";
import Input from "@/components/Input.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import { useAuth } from "@/hooks/auth.jsx";
import { useState } from "react";
import AuthSessionStatus from "@/app/(auth)/AuthSessionStatus.jsx";
import AuthCard from "../AuthCard";

const Page = () => {
  const { forgotPassword } = useAuth({
    middleware: "guest",
    redirectIfAuthenticated: "/dashboard",
  });

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState(null);

  const submitForm = (event) => {
    event.preventDefault();

    forgotPassword({ email, setErrors, setStatus });
  };

  return (
    <AuthCard>
      <div className="mb-4 text-sm text-gray-600">
        Forgot your password? No problem. Just let us know your email address
        and we will email you a password reset link that will allow you to
        choose a new one.
      </div>

      {/* Session Status */}
      <AuthSessionStatus className="mb-4" status={status} />

      <form onSubmit={submitForm}>
        {/* Email Address */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            name="email"
            value={email}
            className="block mt-1 w-full"
            onChange={(event) => setEmail(event.target.value)}
            required
            autoFocus
          />

          <InputError messages={errors.email} className="mt-2" />
        </div>

        <div className="flex items-center justify-end mt-4">
          <Button type="submit">Email Password Reset Link</Button>
        </div>
      </form>
    </AuthCard>
  );
};

export default Page;
