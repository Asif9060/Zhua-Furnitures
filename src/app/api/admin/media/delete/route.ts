import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { destroyCloudinaryImage } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const payload = (await request.json().catch(() => ({}))) as {
    publicId?: string;
  };

  const publicId = String(payload.publicId ?? '').trim();
  if (!publicId) {
    return NextResponse.json({ error: 'publicId is required.' }, { status: 400 });
  }

  try {
    const deleted = await destroyCloudinaryImage(publicId);
    return NextResponse.json(deleted);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not delete cloudinary image.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
