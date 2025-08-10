import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

initOpenNextCloudflareForDev()

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [new URL('https://static.getwhynot.org/**'), new URL('https://static.destinyai.tools/**')]
  },
  reactStrictMode: false,
  experimental: {
    staleTimes: {
      dynamic: 3600,
      static: 3600
    }
  }
}

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: './messages/en.json'
  }
})
export default withNextIntl(nextConfig)
