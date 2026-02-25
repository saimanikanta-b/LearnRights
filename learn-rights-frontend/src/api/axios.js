import axios from "axios";
import { queueOfflineRequest, registerBackgroundSync } from "../utils/offlineSync";

const baseURL = "http://localhost:5000/api";

const instance = axios.create({
  baseURL,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Skip offline queuing for auth routes — login/signup must always go online
    const isAuthRoute = config && (config.url || '').includes('/auth/');

    // If offline and it's a mutating request (but NOT auth), queue it for later sync
    if (!navigator.onLine && !isAuthRoute && config && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
      const relativeUrl = config.url.replace(baseURL, '');
      await queueOfflineRequest(config.method, relativeUrl, config.data ? JSON.parse(config.data) : undefined);
      await registerBackgroundSync();

      // Return a fake success response so the UI doesn't break
      return {
        data: { offline: true, message: 'Action saved offline. Will sync when connected.' },
        status: 202,
        statusText: 'Queued Offline',
        config,
        headers: {},
      };
    }

    console.error("API error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default instance;
