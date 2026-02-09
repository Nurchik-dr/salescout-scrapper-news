import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import dotenv from "dotenv";
import { RawNews } from "../types";
import readline from "readline";

dotenv.config();

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

export async function scrapeTelegram(): Promise<RawNews[]> {
  const apiId = Number(process.env.TG_API_ID);
  const apiHash = process.env.TG_API_HASH as string;

  const session = new StringSession(process.env.TG_SESSION || "");

  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log("📲 Telegram login...");

  await client.start({
    phoneNumber: async () => await ask("📞 Phone number: "),
    password: async () => await ask("🔐 2FA password (если есть): "),
    phoneCode: async () => await ask("💬 Code from Telegram: "),
    onError: (err) => console.log("TG ERROR:", err),
  });

  console.log("✅ Telegram connected!");

  const channels = [
    "tengrinews",
    "informburo_kz",
    "kazinform_news",
    "rian_ru",
    "sputnikKZ",
  ];

  const results: RawNews[] = [];

  for (const ch of channels) {
    try {
      console.log(`📥 Loading channel: @${ch}`);

      const entity = await client.getEntity(ch);
      const messages = await client.getMessages(entity, { limit: 20 });

      for (const msg of messages) {
        if (!msg.message) continue;

        results.push({
          source: `telegram:@${ch}`,
          rawTitle: msg.message.slice(0, 80),
          rawText: msg.message,
          rawUrl: `https://t.me/${ch}`,
          rawDate: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.log(`❌ Channel failed: @${ch}`, err);
    }
  }

  console.log("💾 SESSION (вставь в .env чтобы не логиниться снова):");
  console.log(client.session.save());

  // ✅ FIX TIMEOUT
  await client.destroy();
  await client.disconnect();

  return results;
}
