import { Router } from 'express';
import {
  createPaymentHandler,
  countPaymentHandler,
  getAllPayments,
  getPendingPayments,
  approvePaymentHandler,
  rejectPaymentHandler,
  createPaymentByProofHandler,
} from '../../modules/payment/payment.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { roleMiddleware } from '../../middlewares/roleMiddleware';
import { activityMiddleware } from '../../middlewares/activityMiddleware';
import { upload } from '../../middlewares/uploadMiddleware';

const router = Router();

router.post('/request', authMiddleware, activityMiddleware, createPaymentHandler);
router.post('/confirm', authMiddleware, activityMiddleware,upload.single('image_upload'), createPaymentByProofHandler); // new feature
router.get('/count', authMiddleware, activityMiddleware, countPaymentHandler);

// Admin
router.get('/pending', authMiddleware, roleMiddleware('admin'), getPendingPayments);
router.post("/approve/:id", authMiddleware, roleMiddleware('admin'), approvePaymentHandler);
router.post("/reject/:id", authMiddleware, roleMiddleware('admin'), rejectPaymentHandler);

// next feature
router.get('/', authMiddleware, getAllPayments);

export default router;
