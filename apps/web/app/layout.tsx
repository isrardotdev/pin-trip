import type { Metadata, Viewport } from 'next'
import { Playfair_Display, DM_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const SITE_URL = 'https://wanderpin.app'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500'],
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400'],
})

export const viewport: Viewport = {
  themeColor: '#1C1C1A',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'WanderPin — Save what you scroll past',
    template: '%s — WanderPin',
  },
  description:
    'Share a travel reel. It pins on your personal world map. Chat with AI to plan your trip using only your saved places.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'WanderPin — Save what you scroll past',
    description: 'Stop losing the places that make you stop scrolling.',
    url: SITE_URL,
    siteName: 'WanderPin',
    type: 'website',
    // og:image is auto-generated from app/opengraph-image.tsx — no need to list it here.
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WanderPin — Save what you scroll past',
    description: 'Stop losing the places that make you stop scrolling.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}>
      <body className="font-body bg-bg-primary text-text-primary antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
