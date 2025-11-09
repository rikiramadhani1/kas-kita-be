// import { Request, Response, NextFunction } from 'express';
// import { verifyAccessToken, JwtPayload } from '../utils/jwt';
// import { errorResponse } from '../utils/response';

// export interface AuthRequest extends Request {
//   user?: JwtPayload;
// }

// export const authMiddleware = (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer '))
//     return errorResponse(res, 'Unauthorized', 401);

//   const token = authHeader.split(' ')[1];
//   const decoded = verifyAccessToken(token);

//   if (!decoded) return errorResponse(res, 'Invalid or expired token', 403);

//   req.user = decoded; // ✅ sekarang aman, user ada setelah middleware
//   next();
// };












import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { errorResponse } from '../utils/response';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Unauthorized', 401);
  }

  const token = authHeader.split(' ')[1];

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return errorResponse(res, 'Invalid or expired token', 403);
  }

  req.user = decoded;

  next();
};

