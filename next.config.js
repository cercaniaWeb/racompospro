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
      {
        // Allow images from any HTTPS source for product image search
        protocol: 'https',
        hostname: '**',
      },
      {
        // Allow images from HTTP source (some legacy stores)
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig