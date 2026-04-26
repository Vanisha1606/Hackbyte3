import axios from "axios";

const NODE_API = import.meta.env.VITE_API_URL || "http://localhost:5001";
const AI_API = import.meta.env.VITE_AI_API_URL || "http://localhost:8001";

export const api = axios.create({ baseURL: NODE_API });
export const aiApi = axios.create({ baseURL: AI_API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
    }
    return Promise.reject(err);
  }
);

export const NODE_API_URL = NODE_API;
export const AI_API_URL = AI_API;
