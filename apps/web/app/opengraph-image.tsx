import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'WanderPin — Save what you scroll past'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1C1C1A',
          backgroundImage:
            'radial-gradient(circle at 22% 28%, rgba(45,106,79,0.35), transparent 50%), radial-gradient(circle at 78% 72%, rgba(82,183,136,0.22), transparent 50%)',
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            display: 'flex',
            backgroundImage: 'linear-gradient(135deg, #52B788, #2D6A4F)',
            marginBottom: 36,
            boxShadow: '0 0 60px rgba(82,183,136,0.35)',
          }}
        />
        <div style={{ display: 'flex', fontSize: 92, color: '#F5F0E8', fontWeight: 700, letterSpacing: -2 }}>
          WanderPin
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: '#A89F93', marginTop: 20 }}>
          Save what you scroll past.
        </div>
      </div>
    ),
    { ...size }
  )
}
