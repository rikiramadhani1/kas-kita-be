import { prisma } from '../../config/database';
import { Admin, Role } from './admin.model';

export const createAdmin = async (
  data: Omit<Admin, 'id' | 'created_at'>
): Promise<Admin> => {
  const result = await prisma.admin.create({
    data: {
      ...data,
      created_at: new Date(),
    },
  });

  // ✅ convert string → enum
  return {
    ...result,
    role: result.role as Role,
  };
};

export const findAdminByEmail = async (email: string): Promise<Admin | null> => {
  const result = await prisma.admin.findUnique({ where: { email } });
  if (!result) return null;

  // ✅ convert string → enum
  return {
    ...result,
    role: result.role as Role,
  };
};
