import { type NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  const exclude = new URL(request.url).searchParams.get('exclude');
  const url = `${API_BASE}/api/v1/platform/ads/active${exclude ? `?exclude=${encodeURIComponent(exclude)}` : ''}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}
