import { Router } from "express";
import {
  loginAdminHandler,
  refreshTokenHandler,
} from "../../modules/admin/admin.controller";
import { loginMemberHandler,setPinByAdminHandler,setPinHandler } from "../../modules/member/member.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { activityMiddleware } from "../../middlewares/activityMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";

const router = Router();

router.post("/admin", loginAdminHandler);
router.post("/", loginMemberHandler);
router.post("/token", activityMiddleware, refreshTokenHandler);
router.post("/pin", authMiddleware, activityMiddleware, setPinHandler);

// Hanya admin yang bisa akses
router.post("/members/:member_id/pin", authMiddleware, roleMiddleware('admin'), setPinByAdminHandler
);

export default router;
