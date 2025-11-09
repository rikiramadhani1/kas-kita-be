import { Router } from "express";
import {
  getCashFlow,
  createCashflow,
  getSaldo
} from "../../modules/cashflow/cashflow.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { activityMiddleware } from "../../middlewares/activityMiddleware";

const router = Router();

router.get("/", authMiddleware, activityMiddleware, getCashFlow);
router.post("/", authMiddleware, createCashflow);
router.get("/saldo", authMiddleware, getSaldo);

export default router;
