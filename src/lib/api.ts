import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});
let refreshing: Promise<string> | null = null;

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("mountain_access");
  localStorage.removeItem("mountain_refresh");
  document.cookie = "mountain_session=; path=/; max-age=0; samesite=lax";
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("mountain_access");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status !== 401 ||
      original?._retry ||
      original?.url?.includes("/auth/refresh")
    )
      throw error;
    original._retry = true;
    refreshing ??= axios
      .post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh/`, {
        refresh: localStorage.getItem("mountain_refresh"),
      })
      .then(({ data }) => {
        localStorage.setItem("mountain_access", data.access);
        return data.access;
      })
      .finally(() => {
        refreshing = null;
      });
    try {
      const token = await refreshing;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      clearAuthSession();
      window.location.replace("/login");
      throw refreshError;
    }
  },
);

export default api;
