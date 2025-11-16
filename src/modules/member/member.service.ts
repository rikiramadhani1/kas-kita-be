import bcrypt from 'bcrypt';
import { updatePin, findMemberByPhoneOrSpouse, findAllMembers, getMemberById } from './repositories/member.repository';
import { ApiError } from '../../utils/response';
import { signAccessToken, signRefreshToken, JwtPayload } from '../../utils/jwt';
import { tokenStore } from '../../stores/tokenStore';
import dotenv from 'dotenv';
dotenv.config();

export const setPin = async (member_id: number, pin: string) => {
  const hashedPin = await bcrypt.hash(pin, 10);
  const updatedMember = await updatePin(member_id, hashedPin);
  return updatedMember.name;
}

export const setPinByAdmin = async (member_id: number) => {
  const defaultPin = process.env.SET_DEFAULT_PIN;
  if (!defaultPin) throw new Error("SET_DEFAULT_PIN tidak diatur di env");
  const hashedPin = await bcrypt.hash(defaultPin, 10);
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

  const user = {
    name: member.name,
    role: 'member',
    phone: member.phone_number
  }

  return { accessToken, refreshToken, user };
};

export const getAllActiveMembers = async () => {
  const members = await findAllMembers();

  const activeMembers = members.map(({ id, name, phone_number, house_number }) => ({
    id,
    name,
    phone_number,
    house_number
  }));

  return activeMembers;
};

export const getMemberByIdService = async (id: number) => {
  return await getMemberById(id);
};
