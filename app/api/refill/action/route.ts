import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase-config';

const actions: Record<string,{status:string;blocker:string;event:string;description:string}> = {
  send_review:{status:'awaiting_provider',blocker:'provider_approval',event:'PHARMACY_REVIEW_REQUESTED',description:'Pharmacy sent the refill to the provider for review.'},
  approve:{status:'verification',blocker:'none',event:'PROVIDER_APPROVED',description:'Provider approved the refill. Pharmacy confirmation is now required.'},
  visit:{status:'action_required',blocker:'visit_required',event:'VISIT_REQUESTED',description:'Provider requested a patient visit before the refill can proceed.'},
  test:{status:'action_required',blocker:'clinical_review',event:'TEST_REQUESTED',description:'Provider requested an additional test before the refill can proceed.'},
  deny:{status:'awaiting_pharmacy',blocker:'clinical_review',event:'PROVIDER_RETURNED',description:'Provider returned the refill to the pharmacy for follow-up.'},
  pharmacy_confirm:{status:'resolved',blocker:'none',event:'PHARMACY_CONFIRMED',description:'Pharmacy confirmed fulfillment after provider approval.'}
};
export async function POST(req:Request){
  const {action,refillId}=await req.json();
  const spec=actions[action]; if(!spec||!refillId) return NextResponse.json({error:'Invalid action.'},{status:400});
  const session=await getSession(); if(!session) return NextResponse.json({error:'Sign in required.'},{status:401});
  if(session.role==='patient' && action!=='visit') return NextResponse.json({error:'You are not authorized for this workflow action.'},{status:403});
  if(session.role==='pharmacy' && !['send_review','pharmacy_confirm'].includes(action)) return NextResponse.json({error:'Pharmacy cannot perform that action.'},{status:403});
  if(session.role==='provider' && !['approve','visit','test','deny'].includes(action)) return NextResponse.json({error:'Provider cannot perform that action.'},{status:403});
  const client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});
  const {data,error}=await client.rpc('medora_apply_refill_action',{p_account_id:session.account_id,p_refill_id:refillId,p_action:action,p_status:spec.status,p_blocker:spec.blocker,p_event:spec.event,p_description:spec.description});
  if(error||!data?.[0]) return NextResponse.json({error:error?.message||'Action failed.'},{status:400});
  return NextResponse.json({ok:true,status:data[0].status});
}
