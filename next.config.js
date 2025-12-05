/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output is not set to export since we have dynamic routes
  // For deployment, we'll need to use server-side rendering
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig