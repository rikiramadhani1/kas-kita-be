import * as repo from "./repositories/payment.repository";
import { prisma } from '../../config/database';


export const getAllPaymentsService = async (phone: string) => {
  return repo.getTransaksiTerakhirByPhone(phone);
};

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
