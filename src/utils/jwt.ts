// import jwt from 'jsonwebtoken';

// export interface JwtPayload {
//   id: number;
//   email: string;
//   role: 'member' | 'admin' | 'bendahara';
// }

// const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';
// const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

// export const signAccessToken = (payload: JwtPayload): string => {
//   return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
// };

// export const signRefreshToken = (payload: JwtPayload): string => {
//   return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
// };

// export const verifyAccessToken = (token: string): JwtPayload | undefined => {
//   try {
//     return jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
//   } catch {
//     return undefined;
//   }
// };

// export const verifyRefreshToken = (token: string): JwtPayload | null => {
//   try {
//     return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
//   } catch {
//     return null;
//   }
// };


























import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: number;
  email: string;
  role: 'member' | 'admin' | 'bendahara';
}

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

export const signRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '31d' });
};

export const verifyAccessToken = (token: string): JwtPayload | undefined => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
  } catch {
    return undefined;
  }
};

export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};
