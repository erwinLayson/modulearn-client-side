import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? "";
    // Only the public school-registration POST is exempt from the 401 redirect;
    // authenticated GETs (e.g. super-admin /schools) must redirect to login.
    const method = (error.config?.method ?? "get").toLowerCase();
    const isAuthRoute =
      url.includes("/login") ||
      url.includes("/auth/") ||
      url.includes("/logout") ||
      (url.includes("/schools") && method === "post");

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("modulearn_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/** Extracts the server-provided message from an axios error, if any. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const msg = (err as {response?: {data?: {message?: string}}}).response?.data?.message;
    if (msg) return msg;
  }
  return fallback;
}

export default apiClient;
