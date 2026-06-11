import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import AuthProvider from "@/components/shared/AuthProvider";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevConnect",
  description: "A platform for developers to showcase their work",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}