import { AnyZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export const validate = (schema: AnyZodObject) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = schema.safeParse(req.body);
  if (!result.success)
    return errorResponse(res, result.error.errors.map((e) => e.message).join(', '));
  req.body = result.data;
  next();
};
