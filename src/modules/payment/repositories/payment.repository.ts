import { prisma } from '../../../config/database';
import { findMemberByPhoneOrSpouse } from '../../member/repositories/member.repository';

export async function getTransaksiTerakhirByPhone(phone: string) {
  const member = await findMemberByPhoneOrSpouse(phone);
  if (!member) return [];
  return prisma.payment.findMany({
    where: { member_id: member.id },
    orderBy: { created_at: 'desc' },
    take: 5
  });
}

export async function findPendingPaymentByMemberId(member_id: number) {
  return prisma.payment.findMany({
    where: {
      member_id,
      status: "pending",
    },
  });
}

export async function findLastPaymentByMemberId(member_id: number) {
  return prisma.payment.findFirst({
    where: { member_id },
    orderBy: [
      { year: "desc" },
      { month: "desc" },
    ],
  });
}

export async function createPayments(payments: {
  member_id: number;
  month: number;
  year: number;
  amount: number;
}[]) {
  return Promise.all(
    payments.map(p =>
      prisma.payment.create({
        data: {
          member_id: p.member_id,
          month: p.month,
          year: p.year,
          amount: p.amount,
          status: "pending",
        },
      })
    )
  );
}

export async function createPayment(member_id: number, month: number, year: number, amount: number) {
  return prisma.payment.create({
    data: {
      member_id,
      month,
      year,
      amount,
      status: "approved",
      created_at: new Date(),
    },
  });
}

export async function getPendingPayments() {
  return prisma.payment.findMany({
    where: { status: "pending" },
    orderBy: { created_at: "asc" },
    include: {
      member: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function findPaymentById(id: number) {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      member: {
        select: { id: true, name: true, phone_number: true },
      },
    },
  });
}

export async function updatePaymentStatus(id: number, status: "approved" | "rejected") {
  return prisma.payment.update({
    where: { id },
    data: { status },
  });
}

export async function addCashFlow(amount: number, description: string) {
  const maxId = await prisma.cashFlow.aggregate({ _max: { id: true } });
  const nextId = (maxId._max.id || 0) + 1;

  return prisma.cashFlow.create({
    data: {
      id: nextId,
      type: "in",
      source: "dues",
      amount,
      description,
    },
  });
}

export const findPaymentsByMember = async (memberId: number) => {
  return prisma.payment.findMany({
    where: { member_id: memberId },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
  });
};

export const findCashFlowByDescription = async(description: string) => {
  return prisma.cashFlow.findFirst({
    where: { description },
  });
}

export const updateCashFlowAmount = async(id: number, newAmount: number) => {
  return prisma.cashFlow.update({
    where: { id },
    data: { amount: newAmount },
  });
}
