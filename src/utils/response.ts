import { Response } from 'express';

interface Meta {
  success: boolean;
  message: string;
  code: number;
}

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const successResponse = (
  res: Response,
  message: string,
  data: any = null,
  code = 200
) => {
  const meta: Meta = { success: true, message, code };
  return res.status(code).json({ meta, data });
};

export const errorResponse = (
  res: Response,
  message: string,
  code = 400
) => {
  const meta: Meta = { success: false, message, code };
  return res.status(code).json({ meta, data: null });
};
