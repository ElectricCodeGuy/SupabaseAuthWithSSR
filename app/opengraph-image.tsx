import { ImageResponse } from 'next/og';

// Colours mirror the light theme tokens in globals.css
// (--background, --foreground, --muted-foreground, --primary).
const BG = '#faf9f5';
const FG = '#3d3929';
const MUTED = '#83827d';
const PRIMARY = '#c96442';

export const alt = 'SupaChat — The AI chat starter for Next.js & Supabase';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '80px 96px',
        background: `radial-gradient(900px 420px at 50% 0%, rgba(201, 100, 66, 0.18), ${BG})`,
        backgroundColor: BG,
        color: FG,
        fontFamily: 'sans-serif'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <svg width={88} height={88} viewBox="0 0 32 32" fill="none">
          <path
            d="M8 3h16a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5h-8.5L10 28.5V23H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Z"
            fill={PRIMARY}
          />
          <path
            d="M16 6.6c.94 3.3 2.1 4.96 5.8 6.2-3.7 1.24-4.86 2.9-5.8 6.2-.94-3.3-2.1-4.96-5.8-6.2 3.7-1.24 4.86-2.9 5.8-6.2Z"
            fill="#ffffff"
          />
          <path
            d="M23 5.4c.4 1.4.9 2.1 2.5 2.6-1.6.5-2.1 1.2-2.5 2.6-.4-1.4-.9-2.1-2.5-2.6 1.6-.5 2.1-1.2 2.5-2.6Z"
            fill="#ffffff"
            opacity={0.75}
          />
        </svg>
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -2 }}>
          SupaChat
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          fontSize: 76,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: -2,
          maxWidth: 1000
        }}
      >
        The AI chat starter for Next.js &amp; Supabase
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 32,
          color: MUTED
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: PRIMARY
          }}
        />
        Open source · MIT
      </div>
    </div>,
    { ...size }
  );
}
