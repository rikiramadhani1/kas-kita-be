import bcrypt from 'bcrypt';
import { findAdminByEmail, createAdmin } from './admin.repository';
import { signAccessToken, signRefreshToken, verifyRefreshToken, JwtPayload } from '../../utils/jwt';
import { ApiError } from '../../utils/response';
import { Role } from './admin.model';
import { tokenStore } from '../../stores/tokenStore';

export const registerAdmin = async (name: string, email: string, password: string) => {
  const existing = await findAdminByEmail(email);
  if (existing) throw new ApiError(400, 'Email sudah terdaftar');

  const hashed = await bcrypt.hash(password, 10);
  const admin = await createAdmin({ name, email, password: hashed, role: Role.Admin });

  return admin;
};

export const loginAdmin = async (email: string, password: string) => {
  const admin = await findAdminByEmail(email);
  if (!admin) throw new ApiError(401, 'Email atau password salah');

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) throw new ApiError(401, 'Email atau password salah');

  const payload: JwtPayload = { id: admin.id, email: admin.email, role: admin.role };

  // Generate tokens tanpa memasukkan 'exp' ke payload
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Simpan refresh token ke Redis
  await tokenStore.add(String(payload.id), refreshToken);

  return { accessToken, refreshToken };
};

export const refreshTokenService = async (refreshToken: string) => {
  const decoded = verifyRefreshToken(refreshToken) as JwtPayload | null;
  if (!decoded) throw new ApiError(403, 'Invalid refresh token');

  const userId = String(decoded.id);

  const valid = await tokenStore.has(userId, refreshToken);
  if (!valid) throw new ApiError(403, 'Expired or revoked refresh token');

  const newAccessToken = signAccessToken({ id: Number(userId), email: decoded.email, role: decoded.role });

  return { accessToken: newAccessToken };
};

export const logoutService = async (refreshToken: string) => {
  const decoded = verifyRefreshToken(refreshToken) as JwtPayload | null;
  if (!decoded) throw new ApiError(403, 'Invalid refresh token');

  const userId = String(decoded.id);
  await tokenStore.remove(userId, refreshToken);

  return true;
};

export const logoutAllService = async (refreshToken: string) => {
  const decoded = verifyRefreshToken(refreshToken) as JwtPayload | null;
  if (!decoded) throw new ApiError(403, 'Invalid refresh token');

  const userId = String(decoded.id);
  await tokenStore.revokeAll(userId);

  return true;
};