import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase-config';
import { getSession } from '@/lib/auth';

function db() {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
}

export async function getCurrentProfile() {
  const session = await getSession();
  if (!session) return { sb: db(), user: null, profile: null };
  return {
    sb: db(),
    user: { id: session.account_id },
    profile: {
      id: session.account_id,
      username: session.username,
      full_name: session.full_name,
      role: session.role,
      organization_id: session.organization_id,
    },
  };
}

export async function getSharedRefill() {
  const session = await getSession();
  if (!session) return { refill: null, events: [], profile: null };
  const { data, error } = await db().rpc('medora_get_current_refill', { p_account_id: session.account_id });
  if (error || !data) return { refill: null, events: [], profile: session };
  return { refill: data.refill, events: data.events ?? [], profile: session };
}
