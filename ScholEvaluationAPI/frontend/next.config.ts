import type { NextConfig } from "next";
import os from "node:os";

function getLocalIp(): string {
  for (const networkInterfaces of Object.values(os.networkInterfaces())) {
    for (const networkInterface of networkInterfaces ?? []) {
      if (networkInterface.family === "IPv4" && !networkInterface.internal) {
        return networkInterface.address;
      }
    }
  }

  return "localhost";
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: [getLocalIp()],
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
