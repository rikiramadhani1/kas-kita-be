import { prisma } from '../../../config/database';

export async function countTodayMessages(phone: string) {
  const start = new Date();
  start.setHours(0,0,0,0);
  return prisma.chatLog.count({ where: { phone, created_at: { gte: start } } });
}

export async function addMessageLog(phone: string, message?: string) {
  const member = await prisma.member.findFirst({ where: { OR: [{ phone_number: phone }, { spouse_phone_number: phone }] } });
  return prisma.chatLog.create({ data: { phone, message, member_id: member?.id } });
}