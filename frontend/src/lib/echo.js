import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Only run in the browser
if (typeof window !== "undefined") {
  // Make Pusher available globally for Echo
  window.Pusher = Pusher;
}

// Get auth token from localStorage (browser only)
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

let echoInstance = null;

export const initializeEcho = (authToken) => {
  // Guard for SSR
  if (typeof window === "undefined") return null;

  if (echoInstance) {
    return echoInstance;
  }

  // No need to fetch CSRF cookie for token-based auth

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
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
    },
    // Use Bearer token authentication
    authorizer: (channel, options) => {
      return {
        authorize: (socketId, callback) => {
          const token = getAuthToken();
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/broadcasting/auth`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
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
