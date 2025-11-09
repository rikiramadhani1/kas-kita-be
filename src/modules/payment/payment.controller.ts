// src/modules/payment/payment.controller.ts
import { Request, Response } from "express";
import * as service from "./payment.service";
import { createPaymentSchema } from "./payment.validation";
import { errorResponse, successResponse } from "../../utils/response";
import { AuthRequest } from "../../middlewares/authMiddleware";

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
    const memberId = (req as any).user?.id;
    if (!memberId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await service.countPaymentService(memberId);

    return res.json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Terjadi kesalahan saat menghitung tanggungan',
      error: (error as Error).message,
    });
  }
};



