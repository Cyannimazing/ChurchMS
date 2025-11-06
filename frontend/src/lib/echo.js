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

  // Disable WebSocket connections - notifications work via API polling
  console.log('Echo/WebSocket disabled - using API polling for notifications');
  return null;
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
