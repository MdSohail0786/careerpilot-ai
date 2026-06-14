/**
 * Axios API client with auth interceptors
 */

import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});
console.log(import.meta.env.VITE_API_URL);
// ─── Request Interceptor: Attach JWT token ─────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("careerpilot_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor: Handle auth errors ──────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect
      localStorage.removeItem("careerpilot_token");
      localStorage.removeItem("careerpilot_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ─── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

// ─── Interview API ─────────────────────────────────────────────────────────────
export const interviewAPI = {
  start: (role) => api.post("/interview/start", { role }),
  submitAnswer: (interviewId, answer) =>
    api.post("/interview/answer", { interviewId, answer }),
  nextQuestion: (interviewId) => api.post("/interview/next", { interviewId }),
  getInterview: (id) => api.get(`/interview/${id}`),
};

// ─── Report API ────────────────────────────────────────────────────────────────
export const reportAPI = {
  generate: (interviewId) => api.post("/report/generate", { interviewId }),
  getReport: (id) => api.get(`/report/${id}`),
  getHistory: () => api.get("/report/history"),
  getByInterview: (interviewId) => api.get(`/report/interview/${interviewId}`),
};

// ─── User API ──────────────────────────────────────────────────────────────────
export const userAPI = {
  updateProfile: (data) => api.put("/user/profile", data),
  changePassword: (data) => api.put("/user/password", data),
  getStats: () => api.get("/user/stats"),
};

export default api;
