import axios from "axios";
import { logEvent } from "../telemetry/logger";

const client = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 5000
});

client.interceptors.response.use(
  res => {
    logEvent("api_success", { url: res.config.url, status: res.status });
    return res;
  },
  err => {
    logEvent("api_error", {
      url: err.config?.url,
      status: err.response?.status
    });
    return Promise.reject(err);
  }
);

export default client;
