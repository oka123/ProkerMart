import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Chat } from "@/components/Chat";
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
  icons: {
    apple: "/apple-touch-icon.png",
  },
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

import { PushNotificationManager } from "@/components/PushNotificationManager";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} antialiased`}>
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
        <PwaRegister />
        <PushNotificationManager />
        {children}
        <Suspense fallback={null}>
          <PwaInstallPrompt />
        </Suspense>
        <Chat />
      </body>
    </html>
  );
}
