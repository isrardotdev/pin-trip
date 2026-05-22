import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#F5F0E8',
          secondary: '#EDE8DE',
        },
        dark: {
          surface: '#1C1C1A',
          secondary: '#2A2A27',
        },
        accent: {
          green: '#2D6A4F',
          'green-light': '#52B788',
          amber: '#C4862A',
        },
        text: {
          primary: '#1C1C1A',
          secondary: '#6B6355',
          tertiary: '#A89F93',
        },
        border: {
          light: '#E0D9CC',
          medium: '#C8BFB0',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
