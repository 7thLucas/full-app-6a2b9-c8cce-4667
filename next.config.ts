import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api-micro-uploader.quantumbyte.ai",
      },
    ],
  },
};

export default nextConfig;
