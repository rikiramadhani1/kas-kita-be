import { Express } from "express";
import authRouter from './routes/auth.route'
import adminRouter from './routes/admin.route';
import memberRouter from './routes/member.route';
import paymentRouter from './routes/payment.route';
import cashflowRouter from './routes/cashflow.route';
import botRouter from './routes/bot.route';
import activityRouter from './routes/activity.route';


export function initRoutes(app: Express) {
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/bot", botRouter);
  app.use("/api/cashflow", cashflowRouter);
  app.use("/api/members", memberRouter);
  app.use("/api/payments", paymentRouter);
  app.use("/api/analytics", activityRouter);

  // ✅ Health check
  app.get("/api", (_, res) => {
    res.json({ ok: true, message: "API KasVMR is running 🚀" });
  });
}