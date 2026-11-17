import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: [
    'mongoose',
    'serverless-http',
    'express',
    'cors',
    'helmet',
    'express-rate-limit'
  ]
};

export default nextConfig;
