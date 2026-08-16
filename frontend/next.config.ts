import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.externals.push('canvas', 'jsdom')
    return config
  },
}

export default nextConfig