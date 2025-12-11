// bot.ts (for local testing only)

import { config } from 'dotenv';
config({ path: '.env' });

import { Telegraf } from 'telegraf';
import { createClient } from '@supabase/supabase-js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Normalize phone number to +855 format
function normalizePhone(phone: string) {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '+855' + cleaned.slice(1);
  } else if (cleaned.startsWith('855') && cleaned.length === 12) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned; // fallback
  }

  return cleaned;
}

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
    return ctx.reply('Invalid or expired session. Please try again on the website.');
  }

  const telegramPhoneRaw = (ctx.from as any)?.phone_number;
  const telegramPhone = normalizePhone(telegramPhoneRaw);
  const sessionPhone = normalizePhone(session.phone_number);

  if (telegramPhone) {
    if (telegramPhone === sessionPhone) {
      await ctx.reply(`
✅ Phone number verified!

Your number ${telegramPhone} is now confirmed.

You can return to the website — it will redirect automatically.
      `);

      await supabase
        .from('verification_sessions')
        .update({
          status: 'success',
          verified: true,
          chat_id: ctx.chat.id,
        })
        .eq('id', session.id);

      await supabase.from('users').upsert({
        phone_number: sessionPhone,
        telegram_chat_id: ctx.chat.id,
      });
    } else {
      await ctx.reply(`
❌ Wrong phone number

You entered ${sessionPhone} on the website,
but your Telegram number is ${telegramPhone}.

Please use the correct number.
      `);

      await supabase
        .from('verification_sessions')
        .update({ status: 'failed' })
        .eq('id', session.id);
    }
    return;
  }

  await ctx.reply(
    `To verify your phone number, please share it with the bot.\n\n` +
    `Tap the button below and confirm.`,
    {
      reply_markup: {
        keyboard: [[{ text: 'Share my phone number', request_contact: true }]],
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    }
  );
});

bot.on('contact', async (ctx) => {
  const telegramPhoneRaw = ctx.message.contact?.phone_number;
  const telegramPhone = normalizePhone(telegramPhoneRaw);

  if (!telegramPhone) {
    return ctx.reply('Could not read your phone number. Please try again.');
  }

  const { data: session } = await supabase
    .from('verification_sessions')
    .select('*')
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!session) {
    return ctx.reply('No active verification found. Please start again from the website.');
  }

  const sessionPhone = normalizePhone(session.phone_number);

  if (telegramPhone === sessionPhone) {
    await ctx.reply(`
✅ Phone number verified!

Your number ${telegramPhone} is now confirmed.

You can return to the website — it will redirect automatically.
    `);

    await supabase
      .from('verification_sessions')
      .update({
        status: 'success',
        verified: true,
        chat_id: ctx.chat.id,
      })
      .eq('id', session.id);

    await supabase.from('users').upsert({
      phone_number: sessionPhone,
      telegram_chat_id: ctx.chat.id,
    });
  } else {
    await ctx.reply(`
❌ Wrong phone number

You entered ${sessionPhone} on the website,
but your Telegram number is ${telegramPhone}.

Please use the correct number.
    `);

    await supabase
      .from('verification_sessions')
      .update({ status: 'failed' })
      .eq('id', session.id);
  }
});

bot.launch();
console.log('Bot is running... (local testing mode)');
