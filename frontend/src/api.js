// Central place for the backend API base URL.
// In production (Render), set VITE_API_BASE_URL in the frontend's
// environment variables to your deployed backend's URL, e.g.
// https://tradexa-backend.onrender.com
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
