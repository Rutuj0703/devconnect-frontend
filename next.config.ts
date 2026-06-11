import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com", // S3 bucket
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com", // GitHub avatars
      },
    ],
  },
};

export default nextConfig;
