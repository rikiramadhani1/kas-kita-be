import { sendWA } from './whatsappHelper';
import { findAllMembers, getUnpaidMonthsForMember } from '../repositories/kasRepository';

export async function sendMonthlyReminder(client: any) {
  const members = await findAllMembers();

  for (const m of members) {
    // if (m.phone_number !== "nomo_hp") continue;
    const { unpaid, lastPaid } = await getUnpaidMonthsForMember(m.id);
    const monthsList = unpaid.map(u => `${u.month}/${u.year}`);

    let message = `📅 *Pengingat Iuran Bulanan Kas VMR 6*\n\nHalo ${m.name}!\n`;

    if (unpaid.length === 0) {
      message += `✅ Terima kasih, kamu sudah membayar sampai bulan ${lastPaid?.month}/${lastPaid?.year}.`;
    } else {
      message += `❌ Kamu belum membayar dari bulan ${monthsList[0]}.\n`;
      message += `📆 Total tunggakan: ${unpaid.length} bulan (${monthsList.slice(0, 5).join(', ')})\n`;
      message += `Silakan lakukan pembayaran dan konfirmasi dengan ketik: *bayar <jumlah_bulan>* (maks 5)\n`;
    }

    await sendWA(client, `${m.phone_number}@s.whatsapp.net`, message);
  }

  console.log(`✅ Broadcast pengingat dikirim ke ${members.length} anggota`);
}
