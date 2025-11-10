import * as repo from "./repositories/payment.repository";

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
    .filter(p => p.status === 'approved')
    .sort((a, b) => (a.year - b.year) || (a.month - b.month)); // urut naik

  const pending = payments.filter(p => p.status === 'pending');

  // Tentukan bulan & tahun terakhir dibayar
  const lastPaid = approved[approved.length - 1];
  const startYear = lastPaid ? lastPaid.year : 2025;
  const startMonth = lastPaid ? lastPaid.month + 1 : 6; // mulai Juni 2025 jika belum ada

  // Hitung jumlah bulan unpaid dari lastPaid → currentMonth
  let unpaidCount =
    (currentYear - startYear) * 12 + (currentMonth - startMonth + 1);
  unpaidCount = unpaidCount > 0 ? unpaidCount : 0;

  // Kurangi unpaidCount dengan pending
  unpaidCount -= pending.length;
  unpaidCount = unpaidCount > 0 ? unpaidCount : 0;

  // Buat daftar monthsDue
  const monthsDue: string[] = [];
  let iterYear = startYear;
  let iterMonth = startMonth;

  for (let i = 0; i < unpaidCount; i++) {
    if (iterMonth > 12) {
      iterMonth = 1;
      iterYear++;
    }
    monthsDue.push(
      new Date(iterYear, iterMonth - 1).toLocaleString('id-ID', {
        month: 'long',
        year: 'numeric',
      })
    );
    iterMonth++;
  }

  // Hitung overpayment: bulan dibayar > currentMonth
  const overpayment = approved.filter(p => {
    return p.year > currentYear || (p.year === currentYear && p.month > currentMonth);
  }).length;

  return {
    message: 'Berhasil menghitung tanggungan',
    data: {
      unpaid: unpaidCount,
      pending: pending.length,
      monthsDue,
      overpayment,
    },
  };
};


