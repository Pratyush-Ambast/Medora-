import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSession } from '@/lib/auth';
import { normalizeUsername } from '@/lib/username';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase-config';
export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: 'Enter your username and password.' }, { status: 400 });
  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await client.rpc('medora_login', { p_username: normalizeUsername(String(username)), p_password: String(password) });
  if (error || !data?.[0]) return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  const account = data[0];
  await createSession(account.account_id);
  return NextResponse.json({ ok: true, role: account.role });
}
