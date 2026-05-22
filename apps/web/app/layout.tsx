import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

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

export const metadata: Metadata = {
  title: 'PinTrip — Save what you scroll past',
  description:
    'Share a travel reel. It pins on your personal map. Chat with AI to plan your trip using only your saved places.',
  openGraph: {
    title: 'PinTrip — Save what you scroll past',
    description: 'The travel app built for Indian wanderers.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}>
      <body className="font-body bg-bg-primary text-text-primary antialiased">{children}</body>
    </html>
  )
}
