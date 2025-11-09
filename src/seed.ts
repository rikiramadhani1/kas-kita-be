import { prisma } from './config/database';
import bcrypt from 'bcryptjs';
async function main() {
  const hashed = await bcrypt.hash('AdminVmr615;', 10);
  await prisma.admin.upsert({
    where: { email: 'admin@kasvmr.com' },
    update: {},
    create: { name: 'Super Admin', email: 'admin@kasvmr.com', password: hashed }
  });
  await prisma.member.createMany({
    data: [
      { name: 'Bapak Rusadi', phone_number: '6289671636130', spouse_phone_number: '12345', house_number: '1' },
      { name: 'Bapak Yoga', phone_number: '6281211517904', spouse_phone_number: '12345', house_number: '2' },
      { name: 'Bapak Rudhy', phone_number: '6287888603142', spouse_phone_number: '12345', house_number: '3' },
      { name: 'Ibu Afrida', phone_number: '6281112223335', spouse_phone_number: '12345', house_number: '3A' },
      { name: 'Bapak Rudi Ikhtiyar', phone_number: '6281213151394', spouse_phone_number: '123425', house_number: '5' },
      { name: 'Ani', phone_number: '62987654321', spouse_phone_number: '54321', house_number: '6' },
      { name: 'Bapak Binsar', phone_number: '6281314432405', spouse_phone_number: '123425', house_number: '7' },
      { name: 'Bapak Aziz', phone_number: '6281806761161', spouse_phone_number: '123415', house_number: '8' },
      { name: 'Ibu Tuti', phone_number: '628999127394', spouse_phone_number: '123450', house_number: '9' },
      { name: 'Anu', phone_number: '62123456789', spouse_phone_number: '12345', house_number: '10' },
      { name: 'Bapak Aji', phone_number: '6282122061989', spouse_phone_number: '123459', house_number: '11' },
      { name: 'Bapak Mirza', phone_number: '628998114778', spouse_phone_number: '123458', house_number: '11A' },
      { name: 'Bapak Gugun', phone_number: '6285781824490', spouse_phone_number: '123457', house_number: '12' },
      { name: 'Ibu Eka', phone_number: '6281112223334', spouse_phone_number: '123456', house_number: '12A' },
      { name: 'Bapak Riki', phone_number: '6282161682424', spouse_phone_number: '6281372994654', house_number: '15' }
    ]
  });
  console.log('Seed done');
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());