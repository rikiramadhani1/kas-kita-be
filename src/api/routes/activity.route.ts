import { Router } from "express";
import { getWAU, getActivityByMember } from "../../modules/analytics/activity.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";

const router = Router();

router.get("/wau", authMiddleware, getWAU);
router.get("/action", authMiddleware, roleMiddleware('admin'), getActivityByMember);

export default router;
