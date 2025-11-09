import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { handleIncomingMessage } from './messageHandler';
import { startMonthlyScheduler } from '../../services/schedulerService';

export async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'info' }),
    printQRInTerminal: false,
    browser: ['KasVMR Bot', 'Chrome', '1.0.0'],
    auth: state,
  });

  // ✅ tampilkan QR manual
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Scan QR berikut untuk login WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const reason = (lastDisconnect?.error as any)?.output?.statusCode;
      setTimeout(() => {
        if (reason !== DisconnectReason.loggedOut) {
          console.log('Reconnecting...');
          startBot();
        } else {
          console.log('Logged out, please rescan QR');
        }
      }, 5000);
    } else if (connection === 'open') {
      console.log('✅ WhatsApp bot connected');

      // 🚀 Jalankan broadcast scheduler saat koneksi sukses
      startMonthlyScheduler(sock);
    } else if (connection === 'connecting') {
      console.log('📡 Connecting to WhatsApp...');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ✅ tangani pesan masuk
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const fromJid = String(m.key.remoteJid || '');
    const sender = fromJid.includes('@s.whatsapp.net')
      ? fromJid.split('@')[0]
      : fromJid;

    const text =
      (
        m.message.conversation ||
        m.message?.extendedTextMessage?.text ||
        ''
      ).trim();

    // ⏩ kirim juga seluruh message object ke handler (biar bisa akses imageMessage, dll)
    try {
      const reply = await handleIncomingMessage(text, sender, sock, m);

      if (reply) {
        await sock.sendMessage(fromJid, { text: reply });
      }
    } catch (e) {
      console.error('❌ message handler error:', e);
    }
  });

  console.log('🚀 WhatsApp bot started');
  return sock;
}
