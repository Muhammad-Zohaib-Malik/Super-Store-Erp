import axios from "axios";

const api = axios.create({
  baseURL: "https://super-store-erp.onrender.com/api/v1",
  withCredentials: true, // Required to send the HTTP-only access token cookie
});

// Intercept responses to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== "/login") {
        // Clear local auth context/cookies and redirect to login
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
