import express from 'express';
import { prisma } from '../../config/database';
const router = express.Router();
router.get('/health', (_, res) => res.json({ ok: true }));
router.post('/simulate', async (req, res) => {
  const { phone, message } = req.body;
  await prisma.chatLog.create({ data: { phone, message } });
  res.json({ ok: true });
});
export default router;