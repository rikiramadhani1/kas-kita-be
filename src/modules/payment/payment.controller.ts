// src/modules/payment/payment.controller.ts
import { Response } from "express";
import * as service from "./payment.service";
import { errorResponse, successResponse } from "../../utils/response";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { createPaymentAdminSchema } from "./payment.validation";

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

export const createPaymentByProofHandler = async (req: any, res: Response) => {
  try {
    const member_id = req.user?.id;
    if (!member_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return errorResponse(res, "File bukti transfer wajib diupload", 400);
    }

    const filePath = req.file.path;

    // Proses OCR dan auto-approve pembayaran
    const result = await service.createPaymentByProofService(member_id, filePath);

    return successResponse(res, "Wuihh mantap kali. Semoga lancar rejeki nya ya", result);
  } catch (err: any) {
    return errorResponse(res, err.message, 400);
  }
};
