import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@playseed/game-core", "@playseed/shared"]
};

export default nextConfig;
