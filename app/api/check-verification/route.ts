// app/api/check-verification/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { phone_number } = await req.json();

  if (!phone_number) {
    return NextResponse.json({ status: 'pending' });
  }

  // Clean exactly the same way as in start-verification
  let cleaned = phone_number.trim().replace(/[\s\-\(\)\+]/g, '');

  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '+855' + cleaned.slice(1);
  } else if (cleaned.startsWith('855') && cleaned.length === 12) {
    cleaned = '+' + cleaned;
  }

  const { data: session } = await supabase
    .from('verification_sessions')
    .select('status')
    .eq('phone_number', cleaned)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ status: session?.status || 'pending' });
}