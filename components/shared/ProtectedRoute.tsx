"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoggedIn, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !isLoggedIn) {
      router.push("/login");
    }
  }, [_hasHydrated, isLoggedIn]);

  if (!_hasHydrated) return null;
  if (!isLoggedIn) return null;

  return <>{children}</>;
}