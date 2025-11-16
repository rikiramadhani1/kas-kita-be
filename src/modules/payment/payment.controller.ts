// src/modules/payment/payment.controller.ts
import { Request, Response } from "express";
import * as service from "./payment.service";
import { createPaymentSchema } from "./payment.validation";
import { errorResponse, successResponse } from "../../utils/response";
import { AuthRequest } from "../../middlewares/authMiddleware";
import fs from "fs";

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

export const createPaymentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, parsed.error.errors[0].message, 400);
    }

    const { months } = parsed.data;
    // ambil member_id dari token
    const member_id = req.user?.id;
    if (!member_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const created = await service.createPaymentRequestService(member_id, months);

    return successResponse(res, "Payment request created", created);
  } catch (err: any) {
    return errorResponse(res, err.message, 400);
  }
};

export const getPendingPayments = async (_: Request, res: Response) => {
  try {
    const list = await service.getPendingPaymentsService();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const approvePaymentHandler = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const result = await service.approvePayment(id);
    return successResponse(res, result.message, result.payment);
  } catch (err: any) {
    return errorResponse(res, err.message, 400);
  }
};

export const rejectPaymentHandler = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const result = await service.rejectPayment(id);
    return successResponse(res, result.message, result.payment);
  } catch (err: any) {
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

    // Hapus file setelah OCR biar folder gak numpuk
    // fs.unlink(filePath, (err) => {
    //   if (err) console.warn("Gagal hapus file bukti:", err);
    // });

    return successResponse(res, "Konfirmasi pembayaran berhasil", result);
  } catch (err: any) {
    return errorResponse(res, err.message, 400);
  }
};

export const listUnpaidMembersHandler = async (req: Request, res: Response) => {
  try {
    const unpaidMembers = await service.findUnpaidMembersService();
    return res.json({
      message: "Berhasil mengambil member yang menunggak",
      data: unpaidMembers,
    });
  } catch (err: any) {
    console.error("[listUnpaidMembersHandler] Error:", err);
    return res.status(500).json({ message: err.message || "Terjadi kesalahan" });
  }
};





