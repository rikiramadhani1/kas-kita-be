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







// export const authMiddleware = (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const authHeader = req.headers.authorization;

//   console.log("=== AUTH DEBUG START ===");
//   console.log("Authorization Header:", authHeader);

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     console.log("❌ No Bearer token found");
//     return errorResponse(res, "Unauthorized", 401);
//   }

//   const token = authHeader.split(" ")[1];
//   console.log("Token extracted:", token);

//   try {
//     const decoded = verifyAccessToken(token);
//     console.log("Decoded result:", decoded);

//     if (!decoded) {
//       console.log("❌ verifyAccessToken returned null");
//       return errorResponse(res, "Invalid or expired token", 403);
//     }

//     req.user = decoded;
//     console.log("✅ Token valid. User:", decoded);
//     console.log("=== AUTH DEBUG END ===");

//     next();
//   } catch (err) {
//     console.log("🔥 JWT VERIFY ERROR:", err);
//     return errorResponse(res, "Invalid or expired token", 403);
//   }
// };

