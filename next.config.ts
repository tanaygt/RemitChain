import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@stellar/freighter-api", "@stellar/stellar-sdk"],
};

export default nextConfig;
