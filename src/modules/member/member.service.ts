import bcrypt from 'bcrypt';
import { updatePin, findMemberByPhoneOrSpouse, findAllMembers, getMemberById } from './repositories/member.repository';
import { ApiError } from '../../utils/response';
import { signAccessToken, signRefreshToken, JwtPayload } from '../../utils/jwt';
import { tokenStore } from '../../stores/tokenStore';

export const setPin = async (member_id: number, pin: string) => {
  const hashedPin = await bcrypt.hash(pin, 10);
  const updatedMember = await updatePin(member_id, hashedPin);
  return updatedMember.name;
}

export const loginMember = async (phone: string, pin: string) => {
  if (!phone) throw new ApiError(400, 'Nomor HP wajib diisi');

  const member = await findMemberByPhoneOrSpouse(phone);
  if (!member) throw new ApiError(404, 'Member tidak ditemukan');

    // ✅ Bandingkan PIN (gunakan bcrypt kalau disimpan hashed)
  const isPinValid = await bcrypt.compare(pin, member.pin ?? '');
  if (!isPinValid) {
    throw new ApiError(401, 'PIN tidak sesuai');
  }

  const payload: JwtPayload = { id: member.id, email: member.phone_number, role: 'member' };

  // Generate token
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Simpan refresh token di Redis
  await tokenStore.add(String(payload.id), refreshToken);

  return { accessToken, refreshToken };
};

export const getAllActiveMembers = async () => {
  return findAllMembers();
};

export const getMemberByIdService = async (id: number) => {
  return await getMemberById(id);
};
