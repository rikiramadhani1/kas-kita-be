import { redis } from '../config/redis';

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 hari dalam detik
const REFRESH_PREFIX = 'refresh_token:';

export const tokenStore = {
  /**
   * Simpan refresh token untuk userId dengan TTL 7 hari
   */
  async add(userId: string, token: string) {
    const key = `${REFRESH_PREFIX}${userId}:${token}`;
    await redis.set(key, 'valid', 'EX', REFRESH_TOKEN_TTL);
  },

  /**
   * Hapus refresh token tertentu
   */
  async remove(userId: string, token: string) {
    const key = `${REFRESH_PREFIX}${userId}:${token}`;
    await redis.del(key);
  },

  /**
   * Cek apakah refresh token masih valid
   */
  async has(userId: string, token: string): Promise<boolean> {
    const key = `${REFRESH_PREFIX}${userId}:${token}`;
    const exists = await redis.exists(key);
    return exists === 1;
  },

  /**
   * Hapus semua refresh token userId (revoke all)
   */
  async revokeAll(userId: string) {
    const pattern = `${REFRESH_PREFIX}${userId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  },
};
