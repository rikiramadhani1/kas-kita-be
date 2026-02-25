// src/modules/payment/payment.controller.ts
import { Request, Response } from "express";
import * as service from "./payment.service";
import { errorResponse, successResponse } from "../../utils/response";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { createPaymentAdminSchema } from "./payment.validation";

export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const phone = req.query.phone as string;
    console.log('Query phone:', phone);

    if (!phone) {
      return res.status(400).json({ error: 'Query param "phone" is required' });
    }

    const list = await service.getAllPaymentsService(phone);
    console.log('Payments list:', list);

    res.json(list);
  } catch (err: any) {
    console.error('Controller error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const createPaymentByAdminHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const parsed = createPaymentAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, parsed.error.errors[0].message, 400);
    }

    const { member_id, total_amount } = parsed.data;

    if (!req.user) return errorResponse(res, "Unauthorized", 401);

    const result = await service.createPaymentByAdminService(
      member_id,
      total_amount
    );

    return successResponse(res, "Payment berhasil dicatat", result);
  } catch (err: any) {
    console.error("[createPaymentByAdminHandler] Error:", err);
    return errorResponse(res, err.message, 400);
  }
};

export const countPaymentHandler = async (req: Request, res: Response) => {
  try {
   const member_id = (req as any).user?.id;
    if (!member_id) {
      return errorResponse(res, "Unauthorized", 401);
    }

    const result = await service.countPaymentService(member_id);

    return successResponse(res, result.message || "Berhasil menghitung tanggungan", result.data);
  } catch (err: any) {
    console.error("[countPaymentHandler] Error:", err);
    return errorResponse(res, err.message || "Terjadi kesalahan saat menghitung tanggungan", 500);
  }
};
