import { CreateCashflowDTO } from "./cashflow.validation";
import * as repo from "./repositories/cashflow.repository";
import { prisma } from '../../config/database';

import { Prisma } from '@prisma/client';

export const createCashflowService = async (body: {
  member_id?: number;
  total_amount: number;
  type: 'in' | 'out';
  source: string;
  description?: string;
}) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const data: Prisma.CashFlowUncheckedCreateInput = {
    member_id: body.member_id, // undefined kalau manual
    month,
    year,
    total_amount: body.total_amount,
    type: body.type,
    source: body.source,
    description: body.description,
  };

  return prisma.cashFlow.create({ data });
};

export const getSaldoService = async (options?: { all?: boolean }) => {
  return repo.getSaldoTerakhir(options);
};

export const getCashFlowTerakhirService = async (year?: number) => {
  const transactions = await repo.getCashFlowByYear(year);

  const grouped: Record<string, any[]> = {};
  transactions.forEach((tx) => {
    const date = new Date(tx.created_at);
    const year = date.getFullYear();
    const month = date.toLocaleString("id-ID", { month: "long" });
    const key = `${year}-${month}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });

  const result = Object.entries(grouped).map(([period, items]) => {
    const [year, month] = period.split("-");
    return { year, month, transactions: items };
  });

  result.sort((a, b) => Number(b.year) - Number(a.year));
  return result;
};

export const getMonthlyMemberSummaryService = async (
  month: number,
  year: number
) => {
  return await repo.getMonthlyMemberSummary(month, year);
};


