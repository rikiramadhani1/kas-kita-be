import { prisma } from '../config/database';

export async function findMemberByPhoneOrSpouse(phone: string) {
  const p = phone.replace(/^\+/, '').trim();
  const byPhone = await prisma.member.findUnique({ where: { phone_number: p } });
  if (byPhone) return byPhone;
  return prisma.member.findFirst({ where: { spouse_phone_number: p } });
}

export async function countTodayMessages(phone: string) {
  const start = new Date();
  start.setHours(0,0,0,0);
  return prisma.chatLog.count({ where: { phone, created_at: { gte: start } } });
}

export async function addMessageLog(phone: string, message?: string) {
  const member = await prisma.member.findFirst({ where: { OR: [{ phone_number: phone }, { spouse_phone_number: phone }] } });
  return prisma.chatLog.create({ data: { phone, message, member_id: member?.id } });
}

export async function getTransaksiTerakhirByPhone(phone: string) {
  const member = await findMemberByPhoneOrSpouse(phone);
  if (!member) return [];
  return prisma.payment.findMany({ where: { member_id: member.id }, orderBy: { created_at: 'desc' }, take: 5 });
}

export async function getSaldoTerakhir() {
  const ins = await prisma.cashFlow.aggregate({ _sum: { amount: true }, where: { type: 'in' } });
  const outs = await prisma.cashFlow.aggregate({ _sum: { amount: true }, where: { type: 'out' } });
  const inSum = ins._sum.amount || 0;
  const outSum = outs._sum.amount || 0;
  return inSum - outSum;
}

export async function addTransactionAndApprove(member_id: number, months: { month: number; year: number }[]) {
  
  const amountPerMonth = Number(process.env.IURAN_AMOUNT) || 20000;
  // ✅ Buat payments langsung status "approved"
  const created = await Promise.all(
    months.map(({ month, year }) =>
      prisma.payment.create({
        data: {
          member_id,
          month,
          year,
          amount: amountPerMonth,
          status: 'approved',
        },
      })
    )
  );

  if (created.length === 0) return { updatedCount: 0, total: 0 };

  // Kelompokkan per bulan/tahun
  const grouped: Record<string, typeof created> = {};
  for (const p of created) {
    const key = `${p.month}-${p.year}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  }

  let totalAll = 0;

  // Update atau buat record cash_flow per bulan
  for (const [key, group] of Object.entries(grouped)) {
    const [month, year] = key.split('-').map(Number);
    const totalMonth = group.reduce((sum, g) => sum + Number(g.amount), 0);
    totalAll += totalMonth;

    const namaBulan = new Date(year, month - 1).toLocaleString('id-ID', { month: 'long' });
    const description = `Iuran bulan ${namaBulan} ${year}`;

    const existing = await prisma.cashFlow.findFirst({
      where: { source: 'dues', description },
    });

    if (existing) {
      await prisma.cashFlow.update({
        where: { id: existing.id },
        data: { amount: existing.amount + totalMonth },
      });
    } else {
      const maxId = await prisma.cashFlow.aggregate({
        _max: { id: true },
      });
      const nextId = (maxId._max.id || 0) + 1;

      await prisma.cashFlow.create({
        data: {
          id: nextId,
          type: 'in',
          source: 'dues',
          amount: totalMonth,
          description,
        },
      });
    }
  }

  return { updatedCount: created.length, total: totalAll };
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export async function getUnpaidMonthsForMember(memberId: number) {
  const START_MONTH = Number(process.env.START_MONTH) || 6;
  const START_YEAR = Number(process.env.START_YEAR) || 2025;

  const payments = await prisma.payment.findMany({
    where: { member_id: memberId, status: 'approved' },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
      { created_at: 'desc' },
    ],
  });

  let lastPaid = null;
  if (payments.length > 0) {
    const last = payments[0];
    lastPaid = { month: last.month, year: last.year };
  }

  const approvedSet = new Set(payments.map(p => `${p.year}-${pad(p.month)}`));

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 🛑 Kalau sudah bayar >= bulan sekarang → tidak ada tunggakan
  if (
    lastPaid &&
    (lastPaid.year > currentYear ||
      (lastPaid.year === currentYear && lastPaid.month >= currentMonth))
  ) {
    return { unpaid: [], lastPaid };
  }

  // 🔢 Tentukan bulan awal
  let month = START_MONTH;
  let year = START_YEAR;

  // Kalau sudah pernah bayar, mulai dari bulan setelahnya
  if (lastPaid) {
    month = lastPaid.month + 1;
    year = lastPaid.year;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  const unpaid = [];

  while (year < currentYear || (year === currentYear && month <= currentMonth)) {
    const key = `${year}-${pad(month)}`;
    if (!approvedSet.has(key)) {
      unpaid.push({ month, year });
    }

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return { unpaid, lastPaid };
}

export async function findAllMembers() {
  return prisma.member.findMany({
    where: {
      status: 'active',
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getCashFlowTerakhir() {
  return prisma.cashFlow.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
  });
}

export async function getPaymentById(id: number) {
  return prisma.payment.findUnique({ where: { id } });
}