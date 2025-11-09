import { Request, Response, NextFunction } from "express";
import { logUserActivity } from "../helpers/activityLogger";
import { AuthRequest } from "./authMiddleware";

export async function activityMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  if (userId) {
    let featureName = "";
    switch (req.path) {
      case "/":
        featureName = "dashboard";
        break;
      case "/count":
        featureName = "payreq";
        break;
      case "/profile":
        featureName = "profile";
        break;
      case "/pin":
        featureName = "set-pin";
        break;
      case "/request":
        featureName = "confirm-pay";
        break;
      default:
        featureName = "other";
        break;
    }

     const metadata = {
      path: req.path,
      method: req.method,
    };
    await logUserActivity(userId, "hit_endpoint", featureName, metadata);
  }
  next();
}
