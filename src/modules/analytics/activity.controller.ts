import { Request, Response } from "express";
import { prisma } from "../../config/database";

// WAU – Weekly Active Users
export const getWAU = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const wau = await prisma.userActivity.groupBy({
      by: ["user_id"],
      where: { created_at: { gte: sevenDaysAgo, lte: today } },
      _count: { user_id: true },
    });

    res.json({ success: true, data: { wau: wau.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getActivityByMember = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, action } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const filter: any = {
      created_at: {
        gte: startDate ? new Date(startDate as string) : today,
        lt: endDate ? new Date(endDate as string) : tomorrow,
      },
    };
    if (action) filter.action = action;

    const activities = await prisma.userActivity.findMany({
      where: filter,
      select: {
        user_id: true,
        action: true,
        feature: true
      },
    });

    const userIds = [...new Set(activities.map(a => a.user_id))];
    const users = await prisma.member.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    // Grouping manual per user + action, dengan feature sebagai array
    const grouped: Record<string, any> = {};
    activities.forEach(a => {
      const key = `${a.user_id}_${a.action}`;
      if (!grouped[key]) {
        grouped[key] = {
          user_id: a.user_id,
          action: a.action,
          feature: [],   // <--- inisialisasi array
          count: 0,
        };
      }
      grouped[key].feature.push(a.feature); // push ke array
      grouped[key].count += 1;
    });

    const result = Object.values(grouped).map(g => {
      const user = users.find(u => u.id === g.user_id);
      return {
        id_member: g.user_id,
        nama_member: user?.name || "Unknown",
        action: g.action,
        count: g.count,
        feature: g.feature, // array semua feature
      };
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};





