/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@redux-ai/langchain',
    '@redux-ai/nextjs',
    '@redux-ai/runtime',
    '@redux-ai/schema',
  ],
};

module.exports = nextConfig;
