import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["usb", "escpos", "escpos-usb", "mongoose"],
};

export default nextConfig;
