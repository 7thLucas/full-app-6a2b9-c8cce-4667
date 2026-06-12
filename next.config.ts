import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "vkum5dyw-4667.quantumbyte.ai",
    "vkum5dyw-4667-prod.quantumbyte.ai",
  ],
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
