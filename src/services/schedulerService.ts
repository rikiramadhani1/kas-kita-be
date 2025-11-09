import cron from 'node-cron';
import { sendMonthlyReminder } from '../helpers/broadcastHelper';

export function startMonthlyScheduler(client: any) {
  // Ambil tanggal & hari dari env (misal: tanggal 1 dan hari ke-5)
  const BROADCAST_DAY = Number(process.env.BROADCAST_DAY) || 3;
  const REMINDER_DAY = Number(process.env.REMINDER_DAY) || 7;

  // Kirim pengingat tiap tanggal BROADCAST_DAY jam 08:00 pagi
  cron.schedule(`0 10 ${BROADCAST_DAY} * *`, async () => {
    console.log('🚀 Jalankan broadcast pengingat awal bulan...');
    await sendMonthlyReminder(client);
  });

  // Kirim ulang pengingat terakhir jika belum bayar (tanggal ke-REMINDER_DAY)
  cron.schedule(`0 10 ${REMINDER_DAY} * *`, async () => {
    console.log('📢 Jalankan broadcast pengingat terakhir...');
    await sendMonthlyReminder(client);
  });
}
