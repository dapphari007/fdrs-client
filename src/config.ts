// Log environment variables for debugging
console.log("Environment variables:", {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
});

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
console.log("Using API URL:", apiUrl);

const config = {
  apiUrl,
};

export default config;
