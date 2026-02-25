import { prisma } from './config/database';
import bcrypt from 'bcryptjs';
async function main() {
  const hashed = await bcrypt.hash('AdminAbang1;', 10);
  await prisma.admin.upsert({
    where: { email: 'admin@kaskita.com' },
    update: {},
    create: { name: 'Super Admin', email: 'admin@kaskita.com', password: hashed }
  });
  await prisma.member.createMany({
    data: [
      { name: 'Riki', phone_number: '6282161682424'},
      { name: 'Riko', phone_number: '6287875093676'},
      { name: 'Tia', phone_number: '6285765590715'},
      { name: 'Ria', phone_number: '6285667655359'},
      { name: 'Aldy', phone_number: '6282177219168'},
      { name: 'Fikri', phone_number: '6282272206809'},
      { name: 'Nurul', phone_number: '6282376290877'},
      { name: 'Nadya', phone_number: '6283830399792'},
    ]
  });
  console.log('Seed done');
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());