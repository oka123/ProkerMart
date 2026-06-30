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
  allowedDevOrigins: [
    ...localIPs,
    "localhost",
    "subarytenoidal-ronna-nondeistically.ngrok-free.dev",
  ],
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
