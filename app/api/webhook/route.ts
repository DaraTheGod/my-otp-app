// app/api/webhook/route.ts
import { Telegraf } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Your bot logic (exactly the same as before)
bot.start(async (ctx) => {
  const session_id = ctx.startPayload;

  if (!session_id) {
    return ctx.reply('Please start from the website.');
  }

  const { data: session } = await supabase
    .from('verification_sessions')
    .select('*')
    .eq('session_id', session_id)
    .eq('verified', false)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (!session) {
    return ctx.reply('Invalid or expired code. Please try again on the website.');
  }

  await ctx.reply(`
🔐 Your Verification Code

OTP: ${session.otp_code}

Please return to the website and enter this code to complete your verification.

(This is a test message — no real data is being used.)
`);
});

// This is the only endpoint Vercel will call
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}