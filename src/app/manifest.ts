import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Racom-POS',
    short_name: 'Racom',
    description: 'Sistema de Punto de Venta para Abarrotes',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1f2937',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}