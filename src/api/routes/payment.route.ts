import { Router } from 'express';
import {
  createPaymentHandler,
  countPaymentHandler,
  getAllPayments,
  getPendingPayments,
  approvePaymentHandler,
  rejectPaymentHandler,
} from '../../modules/payment/payment.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { roleMiddleware } from '../../middlewares/roleMiddleware';
import { activityMiddleware } from '../../middlewares/activityMiddleware';

const router = Router();

router.post('/request', authMiddleware, activityMiddleware, createPaymentHandler);
router.get('/count', authMiddleware, activityMiddleware, countPaymentHandler);

// Admin
router.get('/pending', authMiddleware, roleMiddleware('admin'), getPendingPayments);
router.post("/approve/:id", authMiddleware, roleMiddleware('admin'), approvePaymentHandler);
router.post("/reject/:id", authMiddleware, roleMiddleware('admin'), rejectPaymentHandler);

// next feature
router.get('/', authMiddleware, getAllPayments);

export default router;
