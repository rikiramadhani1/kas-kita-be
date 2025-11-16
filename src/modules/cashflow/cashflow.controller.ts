// src/modules/cashflow/cashflow.controller.ts
import { Request, Response } from "express";
import { getSaldoService, getCashFlowTerakhirService, createCashflowService } from "../cashflow/cashflow.service";
import { successResponse, errorResponse } from '../../utils/response';
import { createCashflowSchema } from "./cashflow.validation";

export const createCashflow = async (req: Request, res: Response) => {
  try {
    // ✅ Validasi payload pakai Zod
    const parsed = createCashflowSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return res.status(400).json({
        message: "Validasi gagal",
        errors,
      });
    }

    const result = await createCashflowService(parsed.data);
    return res.status(201).json({
      message: "Cashflow berhasil dibuat",
      data: result,
    });
  } catch (error: any) {
    console.error("[createCashflow] Error:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat membuat cashflow",
      error: error.message,
    });
  }
};

export const getSaldo = async (req: Request, res: Response) => {
  try {
    const all = req.query.all === "true"; // ?all=true untuk saldo total
    const data = await getSaldoService({ all });
    return successResponse(res, "Berhasil mendapatkan data saldo", data);
  } catch (err: any) {
    return errorResponse(res, err.message, err.code || 400);
  }
};

export const getCashFlow = async (req: Request, res: Response) => {
  try {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const data = await getCashFlowTerakhirService(year);
    return successResponse(res, "Berhasil mendapatkan data transaksi", data);
  } catch (err: any) {
    return errorResponse(res, err.message, err.code || 400);
  }
};
