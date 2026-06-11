"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Loader2 } from "lucide-react";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");

      if (!token) {
        router.push("/login?error=oauth_failed");
        return;
      }

      try {
        localStorage.setItem("accessToken", token);
        const res = await api.get("/users/me");
        login(res.data, token);
        router.push("/feed");
      } catch {
        localStorage.removeItem("accessToken");
        router.push("/login?error=oauth_failed");
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">
        Completing sign in with GitHub...
      </p>
    </div>
  );
}