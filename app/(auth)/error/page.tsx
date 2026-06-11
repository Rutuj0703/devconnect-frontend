"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <XCircle className="h-12 w-12 text-destructive" />
      <h1 className="text-xl font-semibold">Authentication Failed</h1>
      <p className="text-muted-foreground text-sm text-center max-w-sm">
        Something went wrong during GitHub sign in. Please try again.
      </p>
      <Button onClick={() => router.push("/login")}>
        Back to Login
      </Button>
    </div>
  );
}