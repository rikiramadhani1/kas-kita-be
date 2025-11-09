import { Request, Response } from "express";
import { registerAdmin, loginAdmin, refreshTokenService, logoutService, logoutAllService } from "./admin.service";
import { successResponse, errorResponse } from "../../utils/response";

export const registerAdminHandler = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const admin = await registerAdmin(name, email, password);
    return successResponse(res, "Admin registered successfully", { id: admin.id, email: admin.email }, 201);
  } catch (err: any) {
    return errorResponse(res, err.message, 400);
  }
};

export const loginAdminHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginAdmin(email, password);

    return successResponse(res, "Login successful", result);
  } catch (err: any) {
    return errorResponse(res, err.message, 400);
  }
};

export const refreshTokenHandler = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, "Missing refresh token", 400);

    const result = await refreshTokenService(refreshToken);

    return successResponse(res, "Token refreshed successfully", result);
  } catch (err: any) {
    return errorResponse(res, err.message, 403);
  }
};

export const logoutAdminHandler = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, "Missing refresh token", 400);

    await logoutService(refreshToken);

    return successResponse(res, "Logout successful");
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const logoutAllAdminHandler = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, "Missing refresh token", 400);

    await logoutAllService(refreshToken);

    return successResponse(res, "Logout from all devices successful");
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};
