import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Chat } from "@/components/Chat";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProkerMart | Pusat Belanja Organisasi Mahasiswa",
  description:
    "Marketplace terpadu yang menyatukan seluruh aktivitas komersial organisasi kampus dalam satu ekosistem digital.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {children}
        <Chat />
      </body>
    </html>
  );
}
