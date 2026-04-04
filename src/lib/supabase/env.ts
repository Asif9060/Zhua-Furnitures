const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME ?? '';
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY ?? '';
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET ?? '';
const publicCloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';

export const hasPublicSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
export const hasServiceSupabaseEnv = Boolean(supabaseUrl && supabaseServiceRoleKey);
export const hasCloudinaryEnv = Boolean(
  cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret
);

export function getPublicSupabaseEnv(): { url: string; anonKey: string } {
  if (!hasPublicSupabaseEnv) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  };
}

export function getServiceSupabaseEnv(): { url: string; serviceRoleKey: string } {
  if (!hasServiceSupabaseEnv) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  }

  return {
    url: supabaseUrl,
    serviceRoleKey: supabaseServiceRoleKey,
  };
}

export function getAdminEmailAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getCloudinaryEnv(): {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  publicCloudName: string;
} {
  if (!hasCloudinaryEnv) {
    throw new Error('Missing Cloudinary credentials in environment variables.');
  }

  return {
    cloudName: cloudinaryCloudName,
    apiKey: cloudinaryApiKey,
    apiSecret: cloudinaryApiSecret,
    publicCloudName: publicCloudinaryCloudName || cloudinaryCloudName,
  };
}
