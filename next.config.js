/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,        // keeps React strict mode enabled
  swcMinify: true,              // optional, faster builds
  output: "standalone",         // ensures Vercel builds correctly
  // Do NOT set pagesDir or disable appDir
  // Do NOT use next export; keep default server build
};

module.exports = nextConfig;
