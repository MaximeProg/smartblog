import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'SmarterBloggers — The professional multi-tenant blog platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top glow */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: '50%',
            width: 700,
            height: 500,
            marginLeft: -350,
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.25) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Bottom-right accent */}
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            right: -80,
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            display: 'flex',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
            zIndex: 1,
            padding: '0 80px',
          }}
        >
          {/* Logo badge */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 28,
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 56,
              fontWeight: 900,
              color: 'white',
              marginBottom: 36,
              boxShadow: '0 0 80px rgba(99,102,241,0.5), 0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            N
          </div>

          {/* Brand name */}
          <div
            style={{
              fontSize: 90,
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-4px',
              lineHeight: 1,
              marginBottom: 24,
            }}
          >
            SmarterBloggers
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 28,
              color: '#94a3b8',
              marginBottom: 52,
              textAlign: 'center',
              lineHeight: 1.5,
              maxWidth: 700,
            }}
          >
            The professional multi-tenant blog platform
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex',
              gap: 14,
              marginBottom: 52,
            }}
          >
            {[
              { icon: '✓', text: 'Free forever' },
              { icon: '✓', text: 'No credit card' },
              { icon: '✓', text: 'Publish in minutes' },
              { icon: '✓', text: 'Custom domain' },
            ].map((item) => (
              <div
                key={item.text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 100,
                  padding: '10px 22px',
                  fontSize: 17,
                  color: '#cbd5e1',
                  fontWeight: 500,
                }}
              >
                <span style={{ color: '#6366f1', fontWeight: 700 }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>

          {/* CTA button */}
          <div
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              color: 'white',
              padding: '18px 52px',
              borderRadius: 100,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.5px',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            }}
          >
            Create your free blog today →
          </div>
        </div>

        {/* Bottom URL strip */}
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#475569',
            fontSize: 16,
            fontWeight: 500,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 100,
              background: '#6366f1',
              display: 'flex',
            }}
          />
          smartblog-indol.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
