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

  const ins = await prisma.cashFlow.aggregate({
    _sum: { amount: true },
    where: {
      type: "in",
      ...(dateFilter && { created_at: dateFilter }),
    },
  });

  const outs = await prisma.cashFlow.aggregate({
    _sum: { amount: true },
    where: {
      type: "out",
      ...(dateFilter && { created_at: dateFilter }),
    },
  });

  const total_in = ins._sum.amount || 0;
  const total_out = outs._sum.amount || 0;
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
