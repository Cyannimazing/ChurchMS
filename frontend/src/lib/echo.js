import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Only run in the browser
if (typeof window !== "undefined") {
  // Make Pusher available globally for Echo
  window.Pusher = Pusher;
}

// Get auth token from cookies (browser only)
const getAuthToken = () => {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "XSRF-TOKEN") {
      return decodeURIComponent(value);
    }
  }
  return null;
};

let echoInstance = null;

export const initializeEcho = (authToken) => {
  // Guard for SSR
  if (typeof window === "undefined") return null;

  if (echoInstance) {
    return echoInstance;
  }

  // Ensure we have Sanctum cookies before attempting to authorize private channels
  try {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
  } catch (_) {}

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || "9cuxnq0xbtdyev1vnbbz",
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || "localhost",
    wsPort: process.env.NEXT_PUBLIC_REVERB_PORT || 8080,
    wssPort: process.env.NEXT_PUBLIC_REVERB_PORT || 8080,
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME || "http") === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${process.env.NEXT_PUBLIC_BACKEND_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
    // Enable credentials (cookies) for Sanctum authentication
    authorizer: (channel, options) => {
      return {
        authorize: (socketId, callback) => {
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/broadcasting/auth`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "X-Requested-With": "XMLHttpRequest",
              // Include CSRF token for Sanctum session auth if present
              "X-XSRF-TOKEN": getAuthToken() || undefined,
            },
            credentials: "include", // Include cookies (laravel_session, XSRF-TOKEN)
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              callback(null, data);
            })
            .catch((error) => {
              callback(error, null);
            });
        },
      };
    },
  });

  return echoInstance;
};

export const getEcho = () => {
  return echoInstance;
};

export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
};
