import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['unpdf', 'mammoth', 'pptxgenjs'],
};
export default nextConfig;
