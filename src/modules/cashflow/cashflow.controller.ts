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

// export const getSaldo = async (_: Request, res: Response) => {
//   try {
//     const saldo = await getSaldoService();
//     return successResponse(res, 'Berhasil mendapatkan data saldo', saldo);
//       } catch (err: any) {
//         return errorResponse(res, err.message, err.code || 400);
//   }
// };



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

// export const getAllCashflows = async (_: Request, res: Response) => {
//   try {
//     const list = await service.getAllCashflowsService();
//     res.json(list);
//   } catch (err: any) {
//     res.status(500).json({ error: err.message });
//   }
// };

// export const createCashflow = async (req: Request, res: Response) => {
//   try {
//     const { type, source, amount, description } = req.body;
//     if (!type || !source || !amount) {
//       return res.status(400).json({ error: "type, source, dan amount wajib diisi" });
//     }
//     const created = await service.createCashflowService({ type, source, amount: Number(amount), description });
//     res.status(201).json(created);
//   } catch (err: any) {
//     res.status(400).json({ error: err.message });
//   }
// };


