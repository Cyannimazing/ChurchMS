import useSWR from "swr";
import axios from "@/lib/axios";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export const useAuth = ({ middleware, redirectIfAuthenticated } = {}) => {
  const router = useRouter();
  const params = useParams();

  // Check token presence once on the client
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("auth_token");

  const {
    data: user,
    error,
    mutate,
  } = useSWR(
    hasToken ? "/api/user" : null,
    () =>
      axios
        .get("/api/user")
        .then((res) => res.data)
        .catch((error) => {
          if (error.response?.status === 401) {
            localStorage.removeItem("auth_token");
            return null;
          }
          if (error.response?.status !== 409) throw error;

          router.push("/api/verify-email");
        })
  );

  const register = async ({ setErrors, ...props }) => {
    setErrors([]);

    axios
      .post("/api/register", props)
      .then(async (response) => {
        // Store token in localStorage
        localStorage.setItem("auth_token", response.data.token);
        await mutate();
        // Redirect after successful registration
        window.location.href = "/";
      })
      .catch((error) => {
        if (error.response.status !== 422) throw error;

        setErrors(error.response.data.errors);
      });
  };

  const login = async ({ setErrors, setStatus, ...props }) => {
    setErrors([]);
    setStatus(null);

    axios
      .post("/api/login", props)
      .then(async (response) => {
        // Store token in localStorage
        localStorage.setItem("auth_token", response.data.token);
        await mutate();
        // Redirect after successful login
        window.location.href = "/";
      })
      .catch((error) => {
        if (error.response.status !== 422) throw error;

        setErrors(error.response.data.errors);
      });
  };

  const forgotPassword = async ({ setErrors, setStatus, email }) => {
    setErrors([]);
    setStatus(null);

    axios
      .post("/api/forgot-password", { email })
      .then((response) => setStatus(response.data.status))
      .catch((error) => {
        if (error.response.status !== 422) throw error;

        setErrors(error.response.data.errors);
      });
  };

  const resetPassword = async ({ setErrors, setStatus, ...props }) => {
    setErrors([]);
    setStatus(null);

    axios
      .post("/api/reset-password", { token: params.token, ...props })
      .then((response) =>
        router.push("/login?reset=" + btoa(response.data.status))
      )
      .catch((error) => {
        if (error.response.status !== 422) throw error;

        setErrors(error.response.data.errors);
      });
  };

  const resendEmailVerification = ({ setStatus }) => {
    axios
      .post("/api/email/verification-notification")
      .then((response) => setStatus(response.data.status));
  };

  const logout = async () => {
    if (!error) {
      await axios.post("/api/logout").then(() => {
        localStorage.removeItem("auth_token");
        mutate();
      });
    } else {
      localStorage.removeItem("auth_token");
    }

    window.location.pathname = "/";
  };

  useEffect(() => {
    if (middleware === "guest" && redirectIfAuthenticated && user) {
      router.push(redirectIfAuthenticated);
    }

    // If a page requires auth but there is no token, go home
    if (middleware === "auth" && !hasToken) {
      router.replace("/");
      return;
    }

    if (middleware === "auth" && error) {
      // If auth is required but we have an error (likely 401), redirect to login
      localStorage.removeItem("auth_token");
      router.push("/login");
    }

    if (middleware === "auth" && user && !user.email_verified_at) {
      router.push("/verify-email");
    }

    if (typeof window !== "undefined" && window.location.pathname === "/verify-email" && user?.email_verified_at) {
      router.push(redirectIfAuthenticated || "/");
    }
  }, [user, error, middleware, redirectIfAuthenticated, router]);

  return {
    user,
    register,
    login,
    forgotPassword,
    resetPassword,
    resendEmailVerification,
    logout,
  };
};
