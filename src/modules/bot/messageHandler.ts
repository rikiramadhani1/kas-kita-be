import { getTransaksiTerakhirByPhone } from '../payment/repositories/payment.repository';
import { getSaldoTerakhir, getCashFlowTerakhir } from '../cashflow/repositories/cashflow.repository';
import { findMemberByPhoneOrSpouse } from '../member/repositories/member.repository'
import { countTodayMessages, addMessageLog } from '../../modules/bot/repositories/bot.repository';
import { getUnpaidMonthsForMember, addTransactionAndApprove } from '../../repositories/kasRepository'
import { prisma } from '../../config/database';
import { sendWA } from '../../helpers/whatsappHelper';  
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

const BEND_HA = process.env.ADMIN_PHONE || '';
const MAX_MSG_PER_DAY = 20;
const MAX_PAY_MONTHS = 5;

const pendingConfirmations = new Map(); // key: phone, value: { monthsToPay, n, unpaidCount, extraMonths }
// Simpan context pengguna sementara
const pendingQR = new Map<string, number>(); // key: sender, value: memberId

export async function handleIncomingMessage(msgBody: string, fromPhone: string, client: any, m:any) {
  const text = msgBody.trim().toLowerCase();

  // === Rate limiter ===
  const totalToday = await countTodayMessages(fromPhone);
  if (totalToday >= MAX_MSG_PER_DAY) {
    return `🚫 Kamu sudah mencapai batas ${MAX_MSG_PER_DAY} pesan hari ini. Silakan lanjut besok.`;
  }
  await addMessageLog(fromPhone, msgBody);

  // === Validasi member ===
  const member = await findMemberByPhoneOrSpouse(fromPhone);
  if (!member) return '⚠️ Nomor kamu tidak terdaftar sebagai anggota kas.';

  // === Command HELP ===
  if (text === 'help') {
    return `📚 Perintah: \n- *bayar n* : konfirmasi pembayaran kas untuk n bulan \n\tcontoh: bayar 1 (untuk bayar 1 bulan)\n- *info* : menampilkan data anggota\n- *saldo* : menampilkan saldo kas saat ini\n- *transaksi* : menampilkan 5 transaksi terakhir kamu\n- *kas* : menampilkan 5 transaksi kas terakhir`;
    // untuk admin: - approve <id> (bendahara)\n- reject <id> (bendahara)
  }

  // === Command INFO ===
  if (text === 'info') {
    return `📋 Data Anggota\n================\n🏠 Rumah: ${member.house_number || '-'}\n👤 Nama: ${member.name}\n📱 HP: ${member.phone_number}`;
  }

  // === Command SALDO ===
  if (text === 'saldo') {
    const saldo = await getSaldoTerakhir();
    return `💰 Saldo kas saat ini: Rp${Number(saldo).toLocaleString('id-ID')}`;
  }

  // === Command TRANSAKSI ===
  if (text === 'transaksi') {
    const list = await getTransaksiTerakhirByPhone(fromPhone);
    if (!list || list.length === 0) return '📭 Belum ada transaksi yang tercatat.';
    const lines = list
      .map(
        (t: any) =>
          `#${t.id} - ${t.status} - Rp${Number(t.amount).toLocaleString('id-ID')} (${new Date(
            t.created_at,
          ).toLocaleDateString('id-ID')})`,
      )
      .join('\n');
    return `🧾 5 Transaksi Terakhir:\n${lines}`;
  }

   // === Command Kas Flow ===
  if (text === 'kas') {
  const list = await getCashFlowTerakhir(); // ambil dari cash_flow
  if (!list || list.length === 0) return '📭 Belum ada transaksi kas yang tercatat.';
  
  const lines = list
    .map(
      (t: any) =>
        `#${t.id} - ${t.type.toUpperCase()} - Rp${Number(t.amount).toLocaleString('id-ID')} - ${t.description} (${new Date(t.created_at).toLocaleDateString('id-ID')})`
    )
    .join('\n');
  
  return `🧾 5 Transaksi Kas Terakhir:\n${lines}`;
  }

 // === Command BAYAR ===
  if (text.startsWith('bayar')) {
    const parts = text.split(/\s+/);

    // Cek pending
    const pending = await prisma.payment.findFirst({
      where: { member_id: member.id, status: 'pending' },
    });
    if (pending) {
      return `🟡 Kamu masih memiliki pembayaran yang menunggu verifikasi. Mohon tunggu sampai pembayaran ID ${pending.id} disetujui atau ditolak.`;
    }

    const { unpaid, lastPaid } = await getUnpaidMonthsForMember(member.id);

    if (parts.length < 2) {
      if (!unpaid || unpaid.length === 0) {
        return (
          `✅ Kamu sudah lunas hingga bulan ${lastPaid?.month}/${lastPaid?.year}.\n` +
          `Kalau ingin bayar untuk bulan depan, ketik: *bayar <jumlah_bulan>* \n(cth: bayar 3)`
        );
      }

      const monthsList = unpaid.map(u => `${u.month}/${u.year}`);
      const firstUnpaid = monthsList[0];
      const count = monthsList.length;

      return (
        `❌ Kamu belum membayar dari bulan ${firstUnpaid}.\n` +
        `📆 Total tunggakan: ${count} bulan (${monthsList.slice(0, 5).join(', ')})\n` +
        `Untuk membayar, ketik: *bayar <jumlah_bulan>*\ncontoh: bayar 3 (maksimal ${MAX_PAY_MONTHS} bulan)`
      );
    }

    // User menyebut jumlah bulan
    const n = Number(parts[1]);
    if (isNaN(n) || n < 1) return 'Jumlah bulan harus angka >= 1';
    if (n > MAX_PAY_MONTHS) return `Maksimal bayar ${MAX_PAY_MONTHS} bulan.`;

    const unpaidCount = unpaid.length;
    const extraMonths = n - unpaidCount;

    let monthsToPay = unpaid.slice(0, n);

    // Tambahkan bulan ke depan jika lebih
    if (extraMonths > 0) {
      const now = lastPaid ? new Date(lastPaid.year, lastPaid.month - 1) : new Date();
      const futureMonths = [];
      let m = now.getMonth() + 1;
      let y = now.getFullYear();

      for (let i = 0; i < extraMonths; i++) {
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
        futureMonths.push({ month: m, year: y });
      }

      monthsToPay = [...monthsToPay, ...futureMonths];
    }

    // Simpan ke pending konfirmasi
    pendingConfirmations.set(fromPhone, { monthsToPay, n, unpaidCount, extraMonths });

    let confirmMsg =
      `📄 Kamu akan bayar ${n} bulan: ${monthsToPay.map(m => `${m.month}/${m.year}`).join(', ')}.\n`;

    if (extraMonths > 0) {
      confirmMsg += `\nℹ️ Kamu hanya punya ${unpaidCount} tunggakan, jadi ${extraMonths} bulan sisanya akan dicatat sebagai pembayaran ke depan.`;
    }

    confirmMsg += `\n\nKetik *ya* untuk konfirmasi atau *batal* untuk membatalkan.`;

    return confirmMsg;
  }

  // === Konfirmasi BAYAR (ya / batal) ===
  if (text === 'ya' || text === 'batal') {
    const pending = pendingConfirmations.get(fromPhone);
    if (!pending) return '❌ Tidak ada pembayaran yang perlu dikonfirmasi.';

    if (text === 'batal') {
      pendingConfirmations.delete(fromPhone);
      return '❎ Pembayaran dibatalkan.';
    }

    const { monthsToPay, n, unpaidCount, extraMonths } = pending;
    pendingConfirmations.delete(fromPhone);

    // 🔔 Kirim notifikasi ke bendahara
    if (BEND_HA) {
      await sendWA(
        client,
        `${BEND_HA}@s.whatsapp.net`,
        `🔔 Transaksi baru dari ${member.name} (${fromPhone}) - ${n} bulan.\n` +
          `Periode: ${monthsToPay.map((m: any) => `${m.month}/${m.year}`).join(', ')}\n\n` +
          `Ketik: *qr ${member.id}* untuk kirim QR dinamis ke anggota ini.`
      );
    }

    let infoMsg = `✅ Pembayaran dicatat untuk ${n} bulan: ${monthsToPay
      .map((m: any) => `${m.month}/${m.year}`)
      .join(', ')}.\nMenunggu QR Dinamis dari bendahara.`;

    if (extraMonths > 0) {
      infoMsg += `\n\nℹ️ Kamu hanya memiliki ${unpaidCount} tunggakan, jadi ${extraMonths} bulan sisanya dicatat untuk bulan depan.`;
    }

    return infoMsg;
  }

// === Bendahara kirim QR Dinamis (step 1: kirim perintah) ===
  if (text.startsWith('qr')) {
    const parts = text.split(/\s+/);
    if (parts.length < 2) return '❌ Format salah.\nContoh: qr <member_id>';
    const memberId = Number(parts[1]);
    if (isNaN(memberId)) return '❌ Member ID harus berupa angka.';

    const target = await prisma.member.findUnique({ where: { id: memberId } });
    if (!target) return `❌ Member dengan ID ${memberId} tidak ditemukan.`;

    // Simpan context supaya pesan berikutnya (gambar) dikaitkan dengan member ini
    pendingQR.set(fromPhone, memberId);
    return '📎 Sekarang kirim gambar QR untuk member tersebut.';
  }

  // === Bendahara kirim gambar setelah 'qr' ===
  if (m?.message?.imageMessage && pendingQR.has(fromPhone)) {
    const memberId = pendingQR.get(fromPhone)!;
    pendingQR.delete(fromPhone);

    const target = await prisma.member.findUnique({ where: { id: memberId } });
    if (!target) return `❌ Member dengan ID ${memberId} tidak ditemukan.`;

    try {
      // Download media dari pesan gambar
      const buffer = await downloadMediaMessage(m, 'buffer', {});
      const fileName = `qr_${memberId}_${Date.now()}.jpg`;
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);

      // Kirim ke user target
      await client.sendMessage(`${target.phone_number}@s.whatsapp.net`, {
        image: { url: filePath },
        caption: '📲 QR Dinamis dari Bendahara:',
      });

      console.log(`✅ QR dikirim ke ${target.name} (${target.phone_number})`);

      // 🔥 Auto-delete file setelah sukses kirim (tunggu 2 detik biar aman)
      setTimeout(() => {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️ File ${fileName} dihapus setelah dikirim.`);
        } catch (err) {
          console.error('⚠️ Gagal hapus file:', err);
        }
      }, 2000);

      return `✅ QR berhasil dikirim ke ${target.name} (${target.phone_number}).`;
    } catch (err) {
      console.error('❌ Gagal kirim QR:', err);
      return '❌ Gagal memproses gambar QR.';
    }
  }

  // === Bendahara buat payment langsung ===
  if (text.startsWith('payment')) {
    const parts = text.split(/\s+/);
    if (parts.length < 3) return '❌ Format salah.\nContoh: payment <member_id> <jumlah_bulan>';

    const member_id = Number(parts[1]);
    const n = Number(parts[2]);
    if (isNaN(member_id) || isNaN(n) || n < 1) return '❌ member_id dan jumlah bulan harus angka.';

    const { unpaid, lastPaid } = await getUnpaidMonthsForMember(member_id);
    let monthsToPay = unpaid.slice(0, n);

    if (monthsToPay.length < n) {
      const extra = n - monthsToPay.length;
      let now = lastPaid ? new Date(lastPaid.year, lastPaid.month - 1) : new Date();
      for (let i = 0; i < extra; i++) {
        now.setMonth(now.getMonth() + 1);
        monthsToPay.push({ month: now.getMonth() + 1, year: now.getFullYear() });
      }
    }

    const result = await addTransactionAndApprove(member_id, monthsToPay);

    return (
      `✅ Payment untuk member ${member_id} berhasil dibuat & diapprove.\n` +
      `📅 Periode: ${monthsToPay.map(m => `${m.month}/${m.year}`).join(', ')}\n` +
      `💰 Total: Rp${result.total.toLocaleString('id-ID')}`
    );
  }

  // === Command tidak dikenali ===
  return '❌ Perintah tidak dikenali. Ketik *help* untuk daftar perintah.';
}