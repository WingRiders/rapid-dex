import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.experiments.asyncWebAssembly = true
    config.experiments.layers = true
    config.experiments.topLevelAwait = true
    config.output = {
      ...config.output,
      environment: {
        ...config.output?.environment,
        asyncFunction: true,
      },
    }
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3300',
        pathname: '/token-image/**',
      },
    ],
  },
}

export default nextConfig
