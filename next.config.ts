import type { NextConfig } from "next";
import os from "os";

function getLocalIPs() {
  const interfaces = os.networkInterfaces();

  return Object.values(interfaces)
    .flat()
    .filter((iface) => iface && iface.family === "IPv4" && !iface.internal)
    .map((iface) => iface!.address);
}

const localIPs = getLocalIPs();

console.log("Local IPs:", localIPs);

const nextConfig: NextConfig = {
  // Tambahkan wildcard domain dari Cloudflare dan Ngrok
  allowedDevOrigins: [
    ...localIPs,
    "localhost",
    "*.ngrok-free.dev",
    "*.trycloudflare.com",
  ],

  // PENTING: Jika Anda menggunakan Server Actions (Next.js 14+),
  // Anda wajib mengizinkan origin tunnel di sini agar form/mutasi tidak error.
  // serverExternalPackages: [], // (opsional, biarkan jika tidak butuh)
  // experimental: {
  //   serverActions: {
  //     allowedOrigins: ["localhost:3000", "*.loca.lt", "*.ngrok-free.dev"],
  //   },
  // },

  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
