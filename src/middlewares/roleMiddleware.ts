// // src/middlewares/roleMiddleware.ts
// import { Response, NextFunction } from 'express';
// import { AuthRequest } from './authMiddleware';
// import { errorResponse } from '../utils/response';

// export const roleMiddleware = (...roles: string[]) => {
//   return (req: AuthRequest, res: Response, next: NextFunction) => {
//     if (!req.user) return errorResponse(res, 'Unauthorized', 401);

//     if (!roles.includes(req.user.role)) {
//       return errorResponse(res, 'Forbidden: insufficient role', 403);
//     }

//     next();
//   };
// };




import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { errorResponse } from '../utils/response';

export const roleMiddleware = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return errorResponse(res, 'Unauthorized', 401);
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Forbidden: insufficient role', 403);
    }
    next();
  };
};
