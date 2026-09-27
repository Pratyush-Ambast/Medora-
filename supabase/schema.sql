-- Medora shared refill workflow schema. This is also applied to the connected Medora project.
create extension if not exists pgcrypto;
create table if not exists public.organizations (id uuid primary key default gen_random_uuid(), name text not null, type text not null check(type in('pharmacy','provider')), created_at timestamptz not null default now());
create unique index if not exists organizations_name_unique on public.organizations(name);
create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, username text unique, full_name text not null, role text not null check(role in('patient','pharmacy','provider','admin')), organization_id uuid references public.organizations(id), created_at timestamptz not null default now());
create table if not exists public.patients (id uuid primary key default gen_random_uuid(), profile_id uuid unique references public.profiles(id) on delete set null, full_name text not null, dob date, mrn text unique, created_at timestamptz not null default now());
create table if not exists public.medications (id uuid primary key default gen_random_uuid(), name text not null, dosage text, frequency text, created_at timestamptz not null default now());
create table if not exists public.prescriptions (id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patients(id) on delete cascade, medication_id uuid not null references public.medications(id), pharmacy_id uuid references public.organizations(id), provider_id uuid references public.organizations(id), prescribed_by uuid references public.profiles(id), refills_remaining integer not null default 0 check(refills_remaining>=0), status text not null default 'active' check(status in('active','expired','cancelled')), source_document_path text, extracted_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.refill_requests (id uuid primary key default gen_random_uuid(), prescription_id uuid not null references public.prescriptions(id) on delete cascade, patient_id uuid not null references public.patients(id) on delete cascade, pharmacy_id uuid references public.organizations(id), provider_id uuid references public.organizations(id), status text not null default 'requested' check(status in('requested','analyzing','blocked','action_required','awaiting_provider','awaiting_pharmacy','verification','resolved','failed')), blocker_type text check(blocker_type in('no_refills','provider_approval','visit_required','missing_information','clinical_review','insurance','pharmacy','none')), priority text not null default 'normal' check(priority in('low','normal','high','urgent')), assigned_to uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), resolved_at timestamptz);
create table if not exists public.refill_participants (refill_id uuid not null references public.refill_requests(id) on delete cascade, profile_id uuid not null references public.profiles(id) on delete cascade, participant_role text not null check(participant_role in('patient','pharmacy','provider')), joined_at timestamptz not null default now(), primary key(refill_id,profile_id));
create table if not exists public.audit_events (id uuid primary key default gen_random_uuid(), refill_id uuid not null references public.refill_requests(id) on delete cascade, patient_id uuid not null references public.patients(id) on delete cascade, actor_id uuid references public.profiles(id), actor_role text, event_type text not null, from_status text, to_status text, description text not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table if not exists public.documents (id uuid primary key default gen_random_uuid(), patient_id uuid references public.patients(id) on delete cascade, refill_id uuid references public.refill_requests(id) on delete cascade, uploaded_by uuid references public.profiles(id), storage_path text not null, mime_type text, extracted_json jsonb, created_at timestamptz not null default now());
create table if not exists public.workflow_invites (id uuid primary key default gen_random_uuid(), refill_id uuid not null references public.refill_requests(id) on delete cascade, invite_code text not null unique, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), expires_at timestamptz);

alter table public.organizations enable row level security; alter table public.profiles enable row level security; alter table public.patients enable row level security; alter table public.medications enable row level security; alter table public.prescriptions enable row level security; alter table public.refill_requests enable row level security; alter table public.refill_participants enable row level security; alter table public.audit_events enable row level security; alter table public.documents enable row level security; alter table public.workflow_invites enable row level security;

-- Shared-workflow read/update rules. Production deployments should add organization-level admin policies as needed.
drop policy if exists profile_self_select on public.profiles for select to authenticated using((select auth.uid())=id);
drop policy if exists profile_self_update on public.profiles for update to authenticated using((select auth.uid())=id) with check((select auth.uid())=id);
drop policy if exists participant_self_select on public.refill_participants for select to authenticated using(profile_id=(select auth.uid()));
drop policy if exists refill_participant_select on public.refill_requests for select to authenticated using(exists(select 1 from public.refill_participants rp where rp.refill_id=id and rp.profile_id=(select auth.uid())));
drop policy if exists refill_participant_update on public.refill_requests for update to authenticated using(exists(select 1 from public.refill_participants rp where rp.refill_id=id and rp.profile_id=(select auth.uid()) and rp.participant_role in('pharmacy','provider'))) with check(exists(select 1 from public.refill_participants rp where rp.refill_id=id and rp.profile_id=(select auth.uid()) and rp.participant_role in('pharmacy','provider')));
drop policy if exists audit_participant_select on public.audit_events for select to authenticated using(exists(select 1 from public.refill_participants rp where rp.refill_id=audit_events.refill_id and rp.profile_id=(select auth.uid())));
drop policy if exists audit_participant_insert on public.audit_events for insert to authenticated with check(exists(select 1 from public.refill_participants rp where rp.refill_id=audit_events.refill_id and rp.profile_id=(select auth.uid())));
drop policy if exists prescription_participant_select on public.prescriptions for select to authenticated using(exists(select 1 from public.refill_requests rr join public.refill_participants rp on rp.refill_id=rr.id where rr.prescription_id=prescriptions.id and rp.profile_id=(select auth.uid())));
drop policy if exists medication_authenticated_select on public.medications for select to authenticated using(true);
drop policy if exists document_participant_select on public.documents for select to authenticated using(exists(select 1 from public.refill_participants rp where rp.refill_id=documents.refill_id and rp.profile_id=(select auth.uid())));

alter publication supabase_realtime add table public.refill_requests;
alter publication supabase_realtime add table public.audit_events;
alter publication supabase_realtime add table public.refill_participants;

-- Medora username/password authentication. This deliberately does not use Supabase email/phone Auth.
alter table public.profiles drop constraint if exists profiles_id_fkey;
create table if not exists public.medora_accounts (id uuid primary key default gen_random_uuid(), username text not null unique, password_hash text not null, full_name text not null, role text not null check (role in ('patient','pharmacy','provider')), organization_id uuid references public.organizations(id) on delete set null, is_demo boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.medora_sessions (id uuid primary key default gen_random_uuid(), account_id uuid not null references public.medora_accounts(id) on delete cascade, token_hash text not null unique, expires_at timestamptz not null, created_at timestamptz not null default now());
alter table public.medora_accounts enable row level security;
alter table public.medora_sessions enable row level security;

-- The application uses the SECURITY DEFINER RPCs created by the deployed username-auth migration.
-- Passwords are never stored in plaintext. No email/phone value is created for a Medora account.

-- Demo-only reset: restores the shared demo refill to its pristine starting state.
create or replace function public.medora_reset_demo(p_account_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_refill uuid;
  v_patient uuid;
  v_prescription uuid;
  v_patient_account uuid;
  v_pharmacy_account uuid;
begin
  if not exists (select 1 from public.medora_accounts where id = p_account_id and is_demo = true) then
    return false;
  end if;

  select rp.refill_id into v_refill
    from public.refill_participants rp
   where rp.profile_id = p_account_id
   order by rp.joined_at desc
   limit 1;

  if v_refill is null then return false; end if;

  select rr.patient_id, rr.prescription_id into v_patient, v_prescription
    from public.refill_requests rr where rr.id = v_refill;

  if v_patient is null or v_prescription is null then return false; end if;

  select ma.id into v_patient_account
    from public.medora_accounts ma
    join public.patients pt on pt.profile_id = ma.id
   where pt.id = v_patient and ma.is_demo = true limit 1;

  select ma.id into v_pharmacy_account
    from public.medora_accounts ma
   where ma.is_demo = true and ma.role = 'pharmacy' limit 1;

  update public.refill_requests
     set status='blocked', blocker_type='provider_approval', priority='high',
         resolved_at=null, updated_at=now()
   where id=v_refill;

  update public.prescriptions
     set refills_remaining=2, status='active',
         extracted_json=jsonb_build_object(
           'dosage','20 mg','frequency','Once daily','medication','Atorvastatin',
           'refills_remaining',2,'requires_provider_review',true
         ),
         updated_at=now()
   where id=v_prescription;

  delete from public.audit_events where refill_id=v_refill;

  insert into public.audit_events(refill_id,patient_id,actor_id,actor_role,event_type,from_status,to_status,description,metadata)
  values
    (v_refill,v_patient,v_patient_account,'patient','REFILL_REQUESTED',null,'requested','Patient requested a refill.',jsonb_build_object('source','demo')),
    (v_refill,v_patient,v_pharmacy_account,'pharmacy','PRESCRIPTION_ANALYZED','requested','analyzing','Prescription details were extracted and matched to the patient record.',jsonb_build_object('source','demo','ai_extraction',true)),
    (v_refill,v_patient,v_pharmacy_account,'pharmacy','PROVIDER_REVIEW_REQUIRED','analyzing','blocked','Provider review is required before the refill can be fulfilled.',jsonb_build_object('source','demo','blocker','provider_approval'));

  return true;
end;
$$;
revoke execute on function public.medora_reset_demo(uuid) from public;
grant execute on function public.medora_reset_demo(uuid) to anon;
