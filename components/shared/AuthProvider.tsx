"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, login, logout, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated || !accessToken) return;

    const fetchUser = async () => {
      try {
        const res = await api.get("/users/me");
        login(res.data, accessToken);
      } catch {
        logout();
      }
    };

    fetchUser();
  }, [_hasHydrated, accessToken, login, logout]);

  return <>{children}</>;
}