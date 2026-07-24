import { type NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
// Doit rester identique à settings.PLATFORM_TENANT_ID côté backend (config.py).
const PLATFORM_TENANT_ID = process.env.PLATFORM_TENANT_ID || '00000000-0000-0000-0000-000000000001';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await fetch(`${API_BASE}/api/v1/tenants/${PLATFORM_TENANT_ID}/ads/${id}/impression`, { method: 'POST' });
  } catch { /* silent */ }
  return new NextResponse(null, { status: 204 });
}
