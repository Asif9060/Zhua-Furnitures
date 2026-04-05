import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const adminAllowlist = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function hasSupabaseEnv(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  return adminAllowlist.includes(email.toLowerCase());
}

async function fetchIsAdmin(supabase: ReturnType<typeof createServerClient>, userId: string, email?: string | null): Promise<boolean> {
  if (isAdminEmail(email)) {
    return true;
  }

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  return data?.role === 'admin';
}

export async function proxy(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;
  const isAdminPage = path.startsWith('/admin') && path !== '/admin/login';
  const isAccountPage = path.startsWith('/account');
  const isAdminApi = path.startsWith('/api/admin');

  if (!isAdminPage && !isAccountPage && !isAdminApi) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const loginPath = isAdminPage ? '/admin/login' : '/auth/login';
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPage || isAdminApi) {
    const admin = await fetchIsAdmin(supabase, user.id, user.email);
    if (!admin) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }

      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/api/admin/:path*'],
};
