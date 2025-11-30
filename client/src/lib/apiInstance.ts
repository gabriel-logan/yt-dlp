import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const X_API_KEY = import.meta.env.VITE_X_API_KEY;

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
});

apiInstance.interceptors.request.use((config) => {
  if (X_API_KEY) {
    config.headers["X-API-KEY"] = X_API_KEY;
  }
  return config;
});

export default apiInstance;
