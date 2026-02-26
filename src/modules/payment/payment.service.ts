import * as repo from "./repositories/payment.repository";
import { prisma } from '../../config/database';
import Jimp from "jimp";
import crypto from "crypto";
import Tesseract from "tesseract.js";
import { rejectIfCameraPhoto, validateEdgeDensity, validateScreenshotDimension } from "../../utils/image";

export async function createPaymentByAdminService(
  member_id: number,
  total_amount: number
) {
  if (total_amount <= 0) throw new Error("Nominal harus lebih dari 0.");

  const member = await prisma.member.findUnique({ where: { id: member_id } });
  if (!member) throw new Error("Member tidak ditemukan.");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return prisma.$transaction(async (tx) => {
    // 1️⃣ INSERT PAYMENT
    const payment = await tx.payment.create({
      data: {
        member_id,
        month,
        year,
        amount: total_amount,
      },
    });
    console.log("Payment inserted:", payment.id);

    // 2️⃣ UPSERT CASHFLOW (REKAP BULANAN PER MEMBER)
    await tx.cashFlow.upsert({
      where: {
        member_id_month_year: {
          member_id,
          month,
          year,
        },
      },
      update: {
        total_amount: { increment: total_amount },
      },
      create: {
        member_id,
        month,
        year,
        total_amount,
        type: "in",
        source: "kas",
        description: `Uang kas ${member.name} Bulan ${month}`
      },
    });

    console.log("Cashflow updated");

    return payment;
  });
}

export async function createPaymentByProofService(member_id: number, imagePath: string) {
   await rejectIfCameraPhoto(imagePath);

  const validationImage = await Jimp.read(imagePath);
  validateScreenshotDimension(validationImage);
  validateEdgeDensity(validationImage);

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
console.log("Log data upload bukti:", cleanedText);

// --- Validasi nama bendahara
const validNames = ["fikri", "ardi"];
const nameMatch = validNames.some(
  (name) => new RegExp(name, "i").test(cleanedText)
);

// --- Validasi nomor HP
const targetNumber = "082272206809";
const numbersOnly = cleanedText.replace(/\D/g, ""); // hapus semua non-digit
const phoneMatch = numbersOnly.includes(targetNumber);

// --- Valid jika salah satu cocok
if (!nameMatch && !phoneMatch) {
  console.log("Nama bendahara atau nomor tidak ditemukan di struk");
  throw new Error("Bukti transfer tidak valid, silahkan hubungi bendahara");
} else {
  console.log("Bukti transfer valid ✅");
  if (nameMatch) console.log("Nama bendahara ditemukan");
  if (phoneMatch) console.log("Nomor HP ditemukan:", numbersOnly);
}

// --- Nominal pembayaran
const nominalMatch =
  cleanedText.match(/-?\s*rp[\s.]?([\d.,]+)/i) ||
  cleanedText.match(/(\d{2,6}(\.\d{3})+)/);

if (!nominalMatch) {
  console.log("Nominal pembayaran tidak ditemukan di bukti transfer");
  throw new Error("Duit nya gak kebaca, cak tanya bendahara");
}

const nominalStr = nominalMatch[1]
  .replace(/\./g, "") // hapus titik ribuan
  .replace(/,/g, ".") // ubah koma jadi titik desimal
  .trim();

const nominal = parseFloat(nominalStr);
if (isNaN(nominal) || nominal <= 0) {
  throw new Error("Duit nya gak kebaca, cak tanya bendahara");
}
console.log("Nominal diterima:", nominal);

// --- Tanggal struk (opsional)
const tanggalMatch = cleanedText.match(
  /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\s+\d{1,2}:\d{2}(?::\d{2})?)/
);
const tanggal_struk = tanggalMatch ? tanggalMatch[0].trim() : null;

// --- Generate signature hash
const key = `${nominal}|${tanggal_struk || ""}|${cleanedText.slice(0, 120)}`;
const signatureHash = crypto.createHash("sha256").update(key).digest("hex");

// --- Cek duplikasi bukti
const duplicate = await repo.findBySignatureHash(signatureHash);
if (duplicate) {
  console.log(`Yah, si ${member_id} ngirim yang sama`);
  throw new Error(
    "Bukti Transfer udah pernah dikirim ni, cak tanya bendahara dulu"
  );
} 

  await repo.createSignitureHash(member_id, nominal, signatureHash);

  // 8️⃣ Buat payment + update cashflow
  const payment = await createPaymentByAdminService(member_id, nominal);

  console.log("Payment berhasil dibuat:", payment.id);
  return {
    success: true,
    payment_id: payment.id,
    nominal,
  };
}
