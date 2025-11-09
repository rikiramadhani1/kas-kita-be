import { Router } from "express";
import {
  loginAdminHandler,
  refreshTokenHandler,
} from "../../modules/admin/admin.controller";
import { loginMemberHandler,setPinHandler } from "../../modules/member/member.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { activityMiddleware } from "../../middlewares/activityMiddleware";

const router = Router();

router.post("/admin", loginAdminHandler);
router.post("/", loginMemberHandler);
router.post("/token", activityMiddleware, refreshTokenHandler);
router.post("/pin", authMiddleware, activityMiddleware, setPinHandler);

export default router;
