import { NextResponse } from 'next/server';
import { getOptionalUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getOptionalUser();
  return NextResponse.json({ user });
}
