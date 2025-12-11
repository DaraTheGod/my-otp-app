import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { otp } = await req.json();

  if (!otp || otp.length !== 6) {
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
  }

  const { data: session, error } = await supabase
    .from('verification_sessions')
    .select('*')
    .eq('otp_code', otp)
    .eq('verified', false)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
  }

  // Mark as verified
  await supabase
    .from('verification_sessions')
    .update({ verified: true })
    .eq('id', session.id);

  // Optionally create real user
  await supabase.from('users').upsert({
    phone_number: session.phone_number,
    telegram_chat_id: session.chat_id,
  });

  return NextResponse.json({ success: true, phone: session.phone_number });
}