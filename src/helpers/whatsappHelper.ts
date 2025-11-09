import fs from 'fs';

export async function sendWA(client: any, to: string, message: string, mediaPath?: string) {
  try {
    if (mediaPath && fs.existsSync(mediaPath)) {
      const buffer = fs.readFileSync(mediaPath);
      await client.sendMessage(to, {
        image: buffer,
        caption: message,
      });
    } else {
      await client.sendMessage(to, { text: message });
    }
  } catch (err) {
    console.error('❌ Gagal kirim WA ke', to, err);
  }
}

