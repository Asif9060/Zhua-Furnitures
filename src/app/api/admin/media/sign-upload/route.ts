import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { buildPublicId, createUploadSignature } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const payload = (await request.json().catch(() => ({}))) as {
    folder?: string;
    baseName?: string;
  };

  const folder = String(payload.folder ?? 'zhua/products').trim();
  const baseName = String(payload.baseName ?? 'asset').trim() || 'asset';

  try {
    const signed = createUploadSignature({
      folder,
      publicId: buildPublicId(folder, baseName),
    });

    return NextResponse.json(signed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not sign upload request.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
