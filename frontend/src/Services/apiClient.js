import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" },
});

// ✅ Interceptors
apiClient.interceptors.request.use((config) => {
  // Skip token logic for public routes
  const publicPaths = [
    "/auth/login",
    "/auth/signup",
    "/auth/request-password-reset",
    "/auth/reset-password",
  ];
  const isPublic = publicPaths.some((path) => config.url.includes(path));

  if (isPublic) return config; // skip token validation entirely

  const token = localStorage.getItem("token");
  const expiry = localStorage.getItem("token_expiry");

  // Check token expiry
  if (expiry && Date.now() > Number(expiry)) {
    localStorage.removeItem("token");
    localStorage.removeItem("token_expiry");
    window.dispatchEvent(new Event("tokenExpired"));
    return Promise.reject(new Error("Token expired"));
  }

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("token_expiry");
      window.dispatchEvent(new Event("unauthorized"));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
