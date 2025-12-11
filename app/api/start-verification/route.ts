import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { randomInt } from 'crypto';
import { v4 as uuidv4 } from 'uuid'; // we'll add this

export async function POST(req: NextRequest) {
  const { phone_number } = await req.json();

  if (!phone_number) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
  }

  // Clean and convert to +855 (same as before)
  let cleaned = phone_number.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10 || cleaned.length === 9) {
    cleaned = '+855' + cleaned.slice(1);
  } else if (cleaned.startsWith('855') && cleaned.length === 12) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+855') || cleaned.length !== 13) {
    return NextResponse.json({
      error: 'Please enter a valid Cambodian number (e.g. 0972736116)',
    }, { status: 400 });
  }

  const otp = String(randomInt(100000, 999999));
  const session_id = uuidv4(); // random secure token
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const { error } = await supabase.from('verification_sessions').insert({
    phone_number: cleaned,
    otp_code: otp,
    session_id,           // new column
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error('Supabase insert error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }

  const deepLink = `https://t.me/myshop_otp_bot?start=${session_id}`;

  return NextResponse.json({
    message: 'OTP sent! Check Telegram.',
    deepLink,
    otpSent: true,
  });
}