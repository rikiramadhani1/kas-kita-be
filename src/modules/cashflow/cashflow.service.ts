import { CreateCashflowDTO } from "./cashflow.validation";
import * as repo from "./repositories/cashflow.repository";

export const createCashflowService = async (body: CreateCashflowDTO) => {
  return await repo.create(body);
};


// export const getSaldoService = async () => {
//   return repo.getSaldoTerakhir();
// };

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


