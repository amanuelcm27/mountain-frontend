import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Mountain Cafe Admin",
  description: "Restaurant operations dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"><body><QueryProvider><AuthProvider>{children}</AuthProvider></QueryProvider><Toaster position="top-right" richColors /></body></html>
  );
}
