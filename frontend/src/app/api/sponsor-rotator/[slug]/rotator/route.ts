import { type NextRequest, NextResponse } from 'next/server';

// Réseau Docker interne : évite un aller-retour par le domaine public qui
// traverserait Cloudflare une seconde fois et écraserait CF-IPCountry.
const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const exclude = new URL(request.url).searchParams.get('exclude');
  const url = `${API_BASE}/api/v1/public/${slug}/ads/rotator${exclude ? `?exclude=${encodeURIComponent(exclude)}` : ''}`;

  try {
    const cfCountry = request.headers.get('CF-IPCountry');
    const res = await fetch(url, {
      cache: 'no-store',
      headers: cfCountry ? { 'CF-IPCountry': cfCountry } : undefined,
    });
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}
