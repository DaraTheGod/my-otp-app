import { config } from 'dotenv';
config();

import { Telegraf } from 'telegraf';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

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

  // Safe plain-text message – no MarkdownV2, no escaping problems
  await ctx.reply(
    `🔐 Your Verification Code

OTP: ${session.otp_code}

Please return to the website and enter this code to complete your verification.

(This is a test message — no real data is being used.)`
  );
});

bot.launch();
console.log('Bot is running...');