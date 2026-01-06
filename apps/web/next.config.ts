import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@btd/game-core", "@btd/shared"]
};

export default nextConfig;
