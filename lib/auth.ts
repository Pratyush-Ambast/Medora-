import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase-config';

const COOKIE_NAME = 'medora_session';
const SESSION_DAYS = 7;

function db() {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(accountId: string) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  const { error } = await db().rpc('medora_create_session', {
    p_account_id: accountId,
    p_token_hash: tokenHash,
    p_expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const { data, error } = await db().rpc('medora_get_session', { p_token_hash: hashSessionToken(token) });
  if (error || !data?.[0]) return null;
  return data[0] as { account_id: string; username: string; full_name: string; role: string; organization_id: string | null };
}

export async function clearSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await db().rpc('medora_delete_session', { p_token_hash: hashSessionToken(token) });
  store.delete(COOKIE_NAME);
}
