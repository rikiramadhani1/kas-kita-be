import { Request, Response } from 'express';
import { setPin, loginMember, getAllActiveMembers, getMemberByIdService } from './member.service';
import { successResponse, errorResponse } from '../../utils/response';
import { loginMemberSchema, setPinSchema } from './member.validation';
import { AuthRequest } from '../../middlewares/authMiddleware';

export const setPinHandler = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ Validasi pakai Zod
    const parsed = setPinSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, parsed.error.errors[0].message, 400);
    }

    // ambil member_id dari token
    const member_id = req.user?.id;
    if (!member_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { pin } = parsed.data;
    const result = await setPin(member_id, pin);

    return successResponse(res, 'Set PIN Berhasil', result);
  } catch (error: any) {
    console.error("Error in setPinHandler:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const loginMemberHandler = async (req: Request, res: Response) => {
  try {
    // ✅ Validasi body pakai Zod
    const parsed = loginMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, parsed.error.errors[0].message, 400);
    }

    let { phone, pin } = req.body;

    // ✅ Konversi nomor HP dari 0 ke 62
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    } else if (phone.startsWith('+62')) {
      phone = phone.replace('+', ''); // jadi 628xx
    }


    const result = await loginMember(phone, pin);
    return successResponse(res, 'Login member successful', result);
  } catch (err: any) {
    return errorResponse(res, err.message, err.code || 400);
  }
};

export const getAllMembersHandler = async (req: Request, res: Response) => {
  try {
    const members = await getAllActiveMembers();
    return successResponse(res, 'Daftar member berhasil diambil', members);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const getMembersHandler = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        meta: { success: false, message: "ID harus berupa angka", code: 400 },
      });
    }

    const member = await getMemberByIdService(id);
    if (!member) {
      return res.status(404).json({
        meta: { success: false, message: "Member tidak ditemukan", code: 404 },
      });
    }

    return res.json({
      meta: { success: true, message: "Member berhasil diambil", code: 200 },
      data: member,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      meta: { success: false, message: error.message, code: 500 },
    });
  }
};

export const getProfileHandler = async (req: AuthRequest, res: Response) => {
  try {
    // pastikan auth middleware sudah menambahkan req.user
    const id = req.user?.id;
    if (!id) {
      return res.status(401).json({
        meta: { success: false, message: "Unauthorized", code: 401 },
      });
    }

    const profile = await getMemberByIdService(id);
    if (!profile) {
      return res.status(404).json({
        meta: { success: false, message: "Member tidak ditemukan", code: 404 },
      });
    }

    return res.json({
      meta: { success: true, message: "Profile member berhasil diambil", code: 200 },
      data: profile,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      meta: { success: false, message: error.message, code: 500 },
    });
  }
};

