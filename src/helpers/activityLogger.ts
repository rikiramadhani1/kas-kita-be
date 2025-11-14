import { prisma } from "../config/database";

export async function logUserActivity(userId: number, action: string, feature: string, metadata?: object) {
  try {
    await prisma.userActivity.create({
      data: { member_id: userId, action, feature, metadata },
    });
  } catch (err) {
    console.error("Gagal log user activity:", err);
  }
}
