import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { otp } = await req.json();

  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ error: 'Please enter a 6-digit number' }, { status: 400 });
  }

  const { data: session, error } = await supabase
    .from('verification_sessions')
    .select('*')
    .eq('otp_code', otp)
    .eq('verified', false)
    .single(); // remove .gte() for now — we'll check expiration manually

  if (error || !session) {
    return NextResponse.json({ error: 'Wrong code. Please try again.' }, { status: 400 });
  }

  // Check expiration manually
  const now = new Date();
  const expiresAt = new Date(session.expires_at);

  if (now > expiresAt) {
    return NextResponse.json({ error: 'This code has expired. Please request a new one.' }, { status: 400 });
  }

  // Mark as verified
  await supabase
    .from('verification_sessions')
    .update({ verified: true })
    .eq('id', session.id);

  // Optional: create real user
  await supabase.from('users').upsert({
    phone_number: session.phone_number,
    telegram_chat_id: session.chat_id,
  });

  return NextResponse.json({ success: true, phone: session.phone_number });
}