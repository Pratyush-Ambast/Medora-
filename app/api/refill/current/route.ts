import { NextResponse } from 'next/server';
import { getSharedRefill } from '@/lib/refill/repository';
export async function GET(){const {refill,events,profile}=await getSharedRefill(); if(!profile)return NextResponse.json({error:'Sign in required.'},{status:401}); return NextResponse.json({refill,events,profile});}
