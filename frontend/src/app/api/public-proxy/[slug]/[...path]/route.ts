import { type NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

type Ctx = { params: Promise<{ slug: string; path: string[] }> };

function buildUpstreamUrl(slug: string, path: string[], search: string) {
  return `${API_BASE}/api/v1/public/${slug}/${path.join('/')}${search}`;
}

export async function GET(request: NextRequest, { params }: Ctx) {
  const { slug, path } = await params;
  const { search } = new URL(request.url);
  try {
    const res = await fetch(buildUpstreamUrl(slug, path, search), { cache: 'no-store' });
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      return NextResponse.json(await res.json(), { status: res.status });
    }
    return new NextResponse(await res.text(), { status: res.status, headers: { 'Content-Type': ct } });
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const { slug, path } = await params;
  const url = buildUpstreamUrl(slug, path, '');
  try {
    const ct = request.headers.get('content-type') ?? 'application/json';
    const body = await request.text();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': ct },
      ...(body ? { body } : {}),
    });
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const resCt = res.headers.get('content-type') ?? '';
    if (resCt.includes('application/json')) {
      return NextResponse.json(await res.json(), { status: res.status });
    }
    return new NextResponse(await res.text(), { status: res.status });
  } catch {
    return NextResponse.json({ detail: 'Proxy error' }, { status: 502 });
  }
}
