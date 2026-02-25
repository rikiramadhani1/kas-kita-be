import { prisma } from '../../../config/database';
import { CreateCashflowDTO } from "../cashflow.validation";

// export async function getSaldoTerakhir() {
//   const ins = await prisma.cashFlow.aggregate({ _sum: { amount: true }, where: { type: 'in' } });
//   const outs = await prisma.cashFlow.aggregate({ _sum: { amount: true }, where: { type: 'out' } });
//   const inSum = ins._sum.amount || 0;
//   const outSum = outs._sum.amount || 0;
//   return inSum - outSum;
// }

export async function getSaldoTerakhir(options?: { all?: boolean }) {
  let dateFilter = undefined;

  if (!options?.all) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    dateFilter = { gte: startDate, lte: endDate };
  }

  // 🔹 SUM CASHFLOW MASUK
  const ins = await prisma.cashFlow.aggregate({
    _sum: { total_amount: true },
    where: {
      type: "in",
      ...(dateFilter && { created_at: dateFilter }),
    },
  });

  // 🔹 SUM CASHFLOW KELUAR
  const outs = await prisma.cashFlow.aggregate({
    _sum: { total_amount: true },
    where: {
      type: "out",
      ...(dateFilter && { created_at: dateFilter }),
    },
  });

  const total_in = ins._sum.total_amount || 0;
  const total_out = outs._sum.total_amount || 0;
  const saldo = total_in - total_out;

  return { saldo, total_in, total_out };
}

export async function getCashFlowByYear(year?: number) {
  if (year) {
    return prisma.cashFlow.findMany({
      where: {
        created_at: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  // fallback kalau tidak ada filter tahun
  return prisma.cashFlow.findMany({
    orderBy: { created_at: "desc" },
  });
}

export async function getCashFlowTerakhir() {
  return prisma.cashFlow.findMany({
    orderBy: { created_at: "desc" },
  });
}

export const create = async (data: CreateCashflowDTO) => {
  return await prisma.cashFlow.create({ data });
};

export async function getMonthlyMemberSummary(
  month: number,
  year: number
) {
  const [grouped, members, totalIn, totalOut] =
    await prisma.$transaction([
      // 1️⃣ Group by member (kas masuk saja)
      prisma.cashFlow.groupBy({
        by: ["member_id"],
        where: {
          month,
          year,
          type: "in",
          member_id: { not: null },
        },
        _sum: {
          total_amount: true,
        },
        orderBy: {
          member_id: "asc",
  },
      }),

      // 2️⃣ Ambil semua member (untuk join nama)
      prisma.member.findMany({
        select: {
          id: true,
          name: true,
        },
      }),

      // 3️⃣ Total kas masuk bulan itu
      prisma.cashFlow.aggregate({
        _sum: { total_amount: true },
        where: {
          month,
          year,
          type: "in",
        },
      }),

      // 4️⃣ Total kas keluar bulan itu
      prisma.cashFlow.aggregate({
        _sum: { total_amount: true },
        where: {
          month,
          year,
          type: "out",
        },
      }),
    ]);

  // 🔗 Mapping nama member
  const memberMap = Object.fromEntries(
    members.map((m) => [m.id, m.name])
  );

  const memberSummary = grouped.map((g) => ({
    member_id: g.member_id,
    name: memberMap[g.member_id!],
    total_paid: g._sum?.total_amount || 0,
  }));

  const total_in = totalIn._sum.total_amount || 0;
  const total_out = totalOut._sum.total_amount || 0;
  const saldo = total_in - total_out;

  return {
    month,
    year,
    total_in,
    total_out,
    saldo,
    members: memberSummary,
  };
}
