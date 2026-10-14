import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    '192.168.1.129',
    '192.168.1.129:3000',
    '192.168.1.34',
    '192.168.1.34:3000',
    '192.168.1.168',
    '192.168.1.*',
    'localhost:3000'
  ],
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-d1'],

};

export default nextConfig;
