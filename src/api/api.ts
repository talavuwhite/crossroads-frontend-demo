// backendApi.js
import axios from "axios";

const backendApi = axios.create({
  baseURL: import.meta.env.VITE_APP_BACKEND_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default backendApi;
