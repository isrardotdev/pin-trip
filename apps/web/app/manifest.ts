import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WanderPin',
    short_name: 'WanderPin',
    description: 'Save what you scroll past.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1C1C1A',
    theme_color: '#1C1C1A',
    icons: [
      { src: '/logo.png', sizes: '1254x1254', type: 'image/png' },
    ],
  }
}
