// app/api/webhook/route.ts  (production version for Vercel)

import { Telegraf } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  const telegramPhone = (ctx.from as any)?.phone_number;

  if (telegramPhone) {
    if (telegramPhone === session.phone_number) {
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
          chat_id: ctx.chat.id   // ← matches your local bot.ts
        })
        .eq('id', session.id);

      await supabase.from('users').upsert({
        phone_number: session.phone_number,
        telegram_chat_id: ctx.chat.id,
      });
    } else {
      await ctx.reply(`
❌ Wrong phone number

You entered ${session.phone_number} on the website,
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

  // Ask for phone number
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

// Handle when user shares contact
bot.on('contact', async (ctx) => {
  const telegramPhone = ctx.message.contact?.phone_number;

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

  if (telegramPhone === session.phone_number) {
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
        chat_id: ctx.chat.id   // ← matches your local bot.ts
      })
      .eq('id', session.id);

    await supabase.from('users').upsert({
      phone_number: session.phone_number,
      telegram_chat_id: ctx.chat.id,
    });
  } else {
    await ctx.reply(`
❌ Wrong phone number

You entered ${session.phone_number} on the website,
but your Telegram number is ${telegramPhone}.

Please use the correct number.
    `);

    await supabase
      .from('verification_sessions')
      .update({ status: 'failed' })
      .eq('id', session.id);
  }
});

// Vercel webhook handler
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