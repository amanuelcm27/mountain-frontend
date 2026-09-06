"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { clearAuthSession } from "@/lib/api";
import type { LoginRequest, User } from "@/types/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (values: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    if (localStorage.getItem("mountain_access"))
      api
        .get("/auth/me/")
        .then(({ data }) => setUser(data))
        .catch(() => {
          clearAuthSession();
          setUser(null);
          router.replace("/login");
        })
        .finally(() => setLoading(false));
    else setLoading(false);
  }, [router]);
  async function login(values: LoginRequest) {
    const { data } = await api.post("/auth/login/", values);
    localStorage.setItem("mountain_access", data.access);
    localStorage.setItem("mountain_refresh", data.refresh);
    document.cookie =
      "mountain_session=1; path=/; max-age=604800; samesite=lax";
    setUser(data.user ?? (await api.get("/auth/me/")).data);
    router.push("/dashboard");
  }
  async function logout() {
    try {
      await api.post("/auth/logout/");
    } finally {
      clearAuthSession();
      setUser(null);
      router.push("/login");
    }
  }
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
