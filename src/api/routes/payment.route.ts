import { Router } from 'express';
import {
  createPaymentByAdminHandler,
  createPaymentByProofHandler
} from '../../modules/payment/payment.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { roleMiddleware } from '../../middlewares/roleMiddleware';
import { activityMiddleware } from '../../middlewares/activityMiddleware';
import { upload } from '../../middlewares/uploadMiddleware';

const router = Router();

router.post('/request', authMiddleware, roleMiddleware('admin'), createPaymentByAdminHandler);
router.post('/confirm', authMiddleware, activityMiddleware,upload.single('image_upload'), createPaymentByProofHandler); // new feature


export default router;
