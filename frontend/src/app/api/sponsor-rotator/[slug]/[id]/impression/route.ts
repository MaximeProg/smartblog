import { type NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;
  try {
    await fetch(`${API_BASE}/api/v1/public/${slug}/ads/${id}/impression`, { method: 'POST' });
  } catch { /* silent */ }
  return new NextResponse(null, { status: 204 });
}
