import { prisma } from '../../../config/database';

export const updatePin = async (member_id: number, hashedPin: string) => {
  const member = await prisma.member.update({
    where: { id: member_id },
    data: { pin: hashedPin },
  });
  return member;
};

export async function findMemberByPhoneOrSpouse(phone: string) {
  const p = phone.replace(/^\+/, '').trim();
  const byPhone = await prisma.member.findUnique({ where: { phone_number: p } });
  if (byPhone) return byPhone;
  return prisma.member.findFirst({ where: { spouse_phone_number: p } });
}

export async function findAllMembers() {
  return prisma.member.findMany({
    orderBy: {
      id: 'asc',
    },
  });
}

export const getMemberById = async (id: number) => {
  return await prisma.member.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone_number: true,
      created_at: true,
    },
  });
};
