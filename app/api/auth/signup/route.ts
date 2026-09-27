import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSession } from '@/lib/auth';
import { normalizeUsername } from '@/lib/username';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase-config';

export async function POST(req: Request) {
  const { username, password, name, role } = await req.json();
  if (!username || !password || !name || !['patient', 'pharmacy', 'provider'].includes(role)) {
    return NextResponse.json({ error: 'Missing or invalid signup fields.' }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  const normalizedUsername = normalizeUsername(String(username));
  if (!/^[a-z0-9_.-]{1,50}$/.test(normalizedUsername)) {
    return NextResponse.json({ error: 'Username can contain letters, numbers, dots, underscores and hyphens.' }, { status: 400 });
  }

  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await client.rpc('medora_create_account', {
    p_username: normalizedUsername,
    p_password: String(password),
    p_full_name: String(name).trim(),
    p_role: role,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const account = data?.[0];
  if (!account) return NextResponse.json({ error: 'Could not create account.' }, { status: 400 });

  await createSession(account.account_id);
  return NextResponse.json({ ok: true, role: account.role });
}
