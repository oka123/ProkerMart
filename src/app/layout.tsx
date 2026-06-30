import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProkerMart | Pusat Belanja Organisasi Mahasiswa",
  description:
    "Marketplace terpadu yang menyatukan seluruh aktivitas komersial organisasi kampus dalam satu ekosistem digital.",
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ProkerMart",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} antialiased`}>
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
        <PwaRegister />
        {children}
        <Suspense fallback={null}>
          <PwaInstallPrompt />
        </Suspense>
      </body>
    </html>
  );
}
