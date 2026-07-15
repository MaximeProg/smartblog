import { type NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  try {
    const body = await request.text();
    const res = await fetch(`${API_BASE}/api/v1/tenants/${tenantId}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(body ? { body } : {}),
    });
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
