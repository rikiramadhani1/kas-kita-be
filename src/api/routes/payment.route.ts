import { Router } from 'express';
import {
  createPaymentByAdminHandler,
} from '../../modules/payment/payment.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { roleMiddleware } from '../../middlewares/roleMiddleware';
import { activityMiddleware } from '../../middlewares/activityMiddleware';
import { upload } from '../../middlewares/uploadMiddleware';

const router = Router();

router.post('/request', authMiddleware, roleMiddleware('admin'), createPaymentByAdminHandler);

export default router;
