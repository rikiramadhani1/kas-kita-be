import * as repo from "./repositories/payment.repository";
import Tesseract from "tesseract.js";
import Jimp from "jimp";
import crypto from "crypto";
import { findAllMembers } from "../member/repositories/member.repository";

export const getAllPaymentsService = async (phone: string) => {
  return repo.getTransaksiTerakhirByPhone(phone);
};

export async function createPaymentRequestService(member_id: number, n: number) {
  const amountPerMonth = Number(process.env.IURAN_AMOUNT) || 20000;

  if (member_id > 15) {
    throw new Error(`Kamu bukan angota kas.`);
  }

  // Ambil lastPaid
  const lastPayment = await repo.findLastPaymentByMemberId(member_id);

   const pending = await repo.findPendingPaymentByMemberId(member_id);
  if (pending.length > 0) {
    throw new Error(`Kamu masih memiliki pembayaran pending (Bulan: ${pending.map(p => p.month).join(', ')}). Silakan tunggu hingga disetujui atau dibatalkan.`);
  }

  let startMonth = Number(process.env.START_MONTH) || 6;
  let startYear = Number(process.env.START_YEAR) || 2025;

  if (lastPayment) {
    startMonth = lastPayment.month + 1;
    startYear = lastPayment.year;
    if (startMonth > 12) {
      startMonth = 1;
      startYear++;
    }
  }

  // Tentukan bulan baru
  const monthsToPay = [];
  let m = startMonth;
  let y = startYear;

  for (let i = 0; i < n; i++) {
    monthsToPay.push({ month: m, year: y });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  // Simpan ke database
  return repo.createPayments(
    monthsToPay.map(monthObj => ({
      member_id,
      month: monthObj.month,
      year: monthObj.year,
      amount: amountPerMonth,
    }))
  );
}

export const getPendingPaymentsService = async () => {
  return repo.getPendingPayments();
};

export async function approvePayment(id: number) {
  const payment = await repo.findPaymentById(id);
  if (!payment) throw new Error("Payment not found");
  if (payment.status !== "pending") throw new Error("Payment already processed");

  // Update status payment ke approved
  await repo.updatePaymentStatus(id, "approved");

  // Buat deskripsi unik berdasarkan bulan dan tahun
  const monthName = new Date(payment.year, payment.month - 1)
    .toLocaleString("id-ID", { month: "long" });
  const description = `Iuran bulan ${monthName} ${payment.year}`;

  // Cek apakah cash flow dengan deskripsi ini sudah ada
  const existingCashFlow = await repo.findCashFlowByDescription(description);

  if (existingCashFlow) {
    // Jika sudah ada → update jumlahnya (tambah dengan amount baru)
    const newAmount = existingCashFlow.amount + payment.amount;
    await repo.updateCashFlowAmount(existingCashFlow.id, newAmount);
  } else {
    // Jika belum ada → buat entry baru
    await repo.addCashFlow(payment.amount, description);
  }

  return { payment, message: "Payment approved and cash flow recorded/updated" };
}


export async function rejectPayment(id: number) {
  const payment = await repo.findPaymentById(id);
  if (!payment) throw new Error("Payment not found");
  if (payment.status !== "pending") throw new Error("Payment already processed");

  await repo.updatePaymentStatus(id, "rejected");

  return { payment, message: "Payment rejected" };
}

export const countPaymentService = async (memberId: number) => {
  const payments = await repo.findPaymentsByMember(memberId);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const approved = payments
    .filter(p => p.status === "approved")
    .sort((a, b) => (a.year - b.year) || (a.month - b.month));

  const pending = payments.filter(p => p.status === "pending");

  // ===== Tentukan bulan terakhir dibayar =====
  const lastPaid = approved[approved.length - 1];
  const startYear = lastPaid ? lastPaid.year : 2025;
  const startMonth = lastPaid ? lastPaid.month + 1 : 6; // default mulai Juni 2025 kalau belum ada pembayaran

  // ===== Hitung unpaid =====
  let unpaidCount = (currentYear - startYear) * 12 + (currentMonth - startMonth + 1);
  unpaidCount = Math.max(unpaidCount - pending.length, 0);

  // ===== Buat daftar bulan yang belum dibayar =====
  const monthsDue: string[] = [];
  let iterYear = startYear;
  let iterMonth = startMonth;
  for (let i = 0; i < unpaidCount; i++) {
    if (iterMonth > 12) {
      iterMonth = 1;
      iterYear++;
    }
    monthsDue.push(
      new Date(iterYear, iterMonth - 1).toLocaleString("id-ID", {
        month: "long",
        year: "numeric",
      })
    );
    iterMonth++;
  }

  // ===== Hitung overpayment (bulan yang sudah dibayar > bulan sekarang) =====
  let overpayment = 0;
  if (lastPaid) {
    const totalPaidMonths = lastPaid.year * 12 + lastPaid.month;
    const totalCurrentMonths = currentYear * 12 + currentMonth;

    overpayment = Math.max(totalPaidMonths - totalCurrentMonths, 0);
  }

  return {
    message: "Berhasil menghitung tanggungan",
    data: {
      unpaid: unpaidCount,
      pending: pending.length,
      monthsDue,
      overpayment,
    },
  };
};

export const findUnpaidMembersService = async () => {
  const members = await findAllMembers();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const unpaidMembers = await Promise.all(
    members.map(async (member) => {
      const payments = await repo.findPaymentsByMember(Number(member.id));

      const approved = payments
        .filter(p => p.status === "approved")
        .sort((a, b) => (a.year - b.year) || (a.month - b.month));

      const pending = payments.filter(p => p.status === "pending");

      const lastPaid = approved[approved.length - 1];
      const startYear = lastPaid ? lastPaid.year : 2025;
      const startMonth = lastPaid ? lastPaid.month + 1 : 6;

      // ===== Hitung unpaid =====
      let unpaidCount = (currentYear - startYear) * 12 + (currentMonth - startMonth + 1);
      unpaidCount = Math.max(unpaidCount - pending.length, 0);

      // Jika unpaidCount <= 0, berarti tidak ada tunggakan
      if (unpaidCount <= 0) return null;

      const monthsDue: string[] = [];
      let iterYear = startYear;
      let iterMonth = startMonth;
      for (let i = 0; i < unpaidCount; i++) {
        if (iterMonth > 12) {
          iterMonth = 1;
          iterYear++;
        }
        monthsDue.push(
          new Date(iterYear, iterMonth - 1).toLocaleString("id-ID", {
            month: "long",
            year: "numeric",
          })
        );
        iterMonth++;
      }

      return {
        memberId: member.id,
        name: member.name,
        house_number: member.house_number,
        unpaid: unpaidCount,
        monthsDue,
      };
    })
  );

  // Filter hanya yang memiliki unpaid
  return unpaidMembers.filter((member) => member !== null);
};



export async function createPaymentByProofService(member_id: number, imagePath: string) {
   // 1️⃣ Preprocessing gambar biar OCR lebih tajam
  const image = await Jimp.read(imagePath);
  image.grayscale().contrast(0.5).normalize();
  const cleanPath = imagePath.replace(/(\.\w+)$/, "_clean$1");
  await image.writeAsync(cleanPath);

  // 2️⃣ Jalankan OCR
  const {
    data: { text },
  } = await Tesseract.recognize(cleanPath, "ind+eng");

  // 3️⃣ Parsing hasil teks
  const cleanedText = text.replace(/\s+/g, " ").trim();
  console.log("Log data upload bukti : ", cleanedText)

  // --- Nama bendahara/penerima
  const namaMatch = /riki\s+alwi/i.test(cleanedText);
  if (!namaMatch) {
    console.log("Nama bendahara tidak ditemukan , nama di struk : ", namaMatch)
    throw new Error("Bukti transfer tidak valid, silahkan hubungi bendahara");
  }

  // --- Status transaksi (berhasil / sukses)
  // const statusMatch = /(berhasil|sukses)/i.test(cleanedText);
  // if (!statusMatch) {
  //   console.log("Bukti transfer belum valid (tidak ada kata 'berhasil')")
  //   throw new Error("Bukti transfer tidak valid");
  // }

  // --- Nominal pembayaran
  const nominalMatch = cleanedText.match(/-?\s*rp[\s.]?([\d.,]+)/i) || text.match(/(\d{2,6}(\.\d{3})+)/);
  if (!nominalMatch) {
    console.log("Nominal pembayaran tidak ditemukan di bukti transfer")
    throw new Error("Nominal pembayaran tidak terbaca, silahkan hubungi bendahara");
  }

  let nominal = 0;
  const amountPerMonth = Number(process.env.IURAN_AMOUNT) || 20000;
  // Ambil nominal dari grup tangkap
  const nominalStr = nominalMatch[1]
    .replace(/\./g, "")   // hapus titik ribuan
    .replace(/,/g, ".")   // ubah koma jadi titik desimal
    .trim();

  // Parse ke number (selalu positif)
  const parsedValue = parseFloat(nominalStr);
  nominal = isNaN(parsedValue) ? 0 : parsedValue;

  if (nominal >= 200000) {
    console.log('nominalnya berapa : ', nominal)
    throw new Error("Nominal tidak terbaca jelas, silahkan hubungi bendahara")
  }

  const months = Math.round(nominal / amountPerMonth);
  if (months <= 0) {
    console.log("nilai nominal", nominal)
    throw new Error("Nominal tidak sesuai dengan jumlah iuran bulanan, silahkan hubungi bendahara");
  }

  // --- Tanggal struk
  // support format: "11/11 11:52:52", "11-11 11:52", "11/11/2025 11:52"
  const tanggalMatch = cleanedText.match(
    /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\s+\d{1,2}:\d{2}(?::\d{2})?)/
  );
  const tanggal_struk = tanggalMatch ? tanggalMatch[0].trim() : null;

  const key = `${nominal}|${tanggal_struk}|${cleanedText.slice(0, 120)}`;

  const sign = crypto.createHash("sha256").update(key).digest("hex")

  const duplidate = await repo.findBySignatureHash(sign);
  if (duplidate) { 
    console.log(`Yah, si ${member_id} ngirim yang sama`)
    throw new Error("Bukti Transfer sudah pernah dikirim sebelumnya, hubungi bendahara untuk konfirmasi");
  } 

  // ambil last payment
  const lastPayment = await repo.findLastPaymentByMemberId(member_id);
  let startMonth = Number(process.env.START_MONTH) || 6;
  let startYear = Number(process.env.START_YEAR) || 2025;

  if (lastPayment) {
    startMonth = lastPayment.month + 1;
    startYear = lastPayment.year;
    if (startMonth > 12) {
      startMonth = 1;
      startYear++;
    }
  }

  const monthsToPay = [];
  let m = startMonth;
  let y = startYear;

  for (let i = 0; i < months; i++) {
    monthsToPay.push({ month: m, year: y });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  // Buat payment dan auto approve
  const payments = [];
  for (const { month, year } of monthsToPay) {
    const payment = await repo.createPayment(member_id, month, year, amountPerMonth);

    const monthName = new Date(year, month - 1).toLocaleString("id-ID", { month: "long" });
    const desc = `Iuran bulan ${monthName} ${year}`;

    const existing = await repo.findCashFlowByDescription(desc);
    if (existing) {
      await repo.updateCashFlowAmount(existing.id, existing.amount + amountPerMonth);
    } else {
      await repo.addCashFlow(amountPerMonth, desc);
    }

    payments.push(payment);
  }

  await repo.createSignitureHash(member_id, nominal, sign);

  return { nominal, months };
}
