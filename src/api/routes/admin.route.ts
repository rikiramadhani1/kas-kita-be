import { Router } from "express";
import {
  registerAdminHandler,
} from "../../modules/admin/admin.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";

const router = Router();

router.post("/register", authMiddleware, roleMiddleware('admin'), registerAdminHandler);

export default router;
