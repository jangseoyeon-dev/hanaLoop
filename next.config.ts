import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.hanaloop.com",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
