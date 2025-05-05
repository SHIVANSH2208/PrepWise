import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 esllint: {
  ignoreDuringBuilds: true,
 },
 typescript: {
  ignoreBuildErrors: true,
 }
};

export default nextConfig;
