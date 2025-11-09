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

  // Update payment status
  await repo.updatePaymentStatus(id, "approved");

  // Tambahkan ke cash flow
  const monthName = new Date(payment.year, payment.month - 1).toLocaleString("id-ID", { month: "long" });
  const description = `Iuran bulan ${monthName} ${payment.year} (${payment.member.name})`;

  await repo.addCashFlow(payment.amount, description);

  return { payment, message: "Payment approved and cash flow updated" };
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

  const approved = payments.filter(p => p.status === 'approved');
  const pending = payments.filter(p => p.status === 'pending');
  const lastPaid = approved[approved.length - 1];

  let unpaidCount = 0;
  if (!lastPaid) {
    unpaidCount = currentMonth;
  } else {
    const diffMonths =
      (currentYear - lastPaid.year) * 12 +
      (currentMonth - lastPaid.month);
    unpaidCount = diffMonths > 0 ? diffMonths : 0;
  }

  if (unpaidCount === 0 && pending.length === 0) {
    return {
      message: 'Tidak ada tanggungan',
      data: {
        unpaid: 0,
        pending: 0,
        monthsDue: [],
      },
    };
  }

  const monthsDue: string[] = [];
  if (unpaidCount > 0) {
    let startYear = lastPaid ? lastPaid.year : currentYear;
    let startMonth = lastPaid ? lastPaid.month + 1 : 1;

    for (let i = 0; i < unpaidCount; i++) {
      if (startMonth > 12) {
        startMonth = 1;
        startYear++;
      }
      const monthName = new Date(startYear, startMonth - 1).toLocaleString(
        'id-ID',
        { month: 'long', year: 'numeric' }
      );
      monthsDue.push(monthName);
      startMonth++;
    }
  }

  return {
    message: 'Berhasil menghitung tanggungan',
    data: {
      unpaid: unpaidCount,
      pending: pending.length,
      monthsDue,
    },
  };
};



