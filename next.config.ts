import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow mobile devices on the local network to access the dev server
  allowedDevOrigins: [
    '192.168.1.129',
    '192.168.1.129:3000',
    '192.168.1.34',
    '192.168.1.34:3000',
    '192.168.1.168',
    '192.168.1.*',
    'localhost:3000'
  ],
};

export default nextConfig;
