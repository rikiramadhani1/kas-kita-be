import { Router } from "express";
import { getAllMembersHandler, 
    getMembersHandler, 
    getProfileHandler
} from "../../modules/member/member.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { activityMiddleware } from "../../middlewares/activityMiddleware";
const router = Router();

router.get("/", authMiddleware, roleMiddleware('admin'), getAllMembersHandler);
router.get("/profile", authMiddleware, activityMiddleware, getProfileHandler);
router.get("/:id", authMiddleware, roleMiddleware('admin'), getMembersHandler);

// next level
// router.post("/", authMiddleware, roleMiddleware('admin'), postMembersHandler);
// router.put("/:id", authMiddleware, roleMiddleware('admin'), putMembersHandler);
// router.put("/:id", authMiddleware, roleMiddleware('admin'), deleteMembersHandler);

export default router;