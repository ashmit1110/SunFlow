import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const demoUsers = [
  { name: 'Vikram Shah', email: 'admin@sunpower.demo', phone: '9000000001', role: Role.ADMIN },
  { name: 'Priya Sharma', email: 'priya@sunpower.demo', phone: '9000000002', role: Role.SALES },
  { name: 'Raghav Patel', email: 'raghav@sunpower.demo', phone: '9000000003', role: Role.WAREHOUSE },
  { name: 'Arjun Rao', email: 'arjun@sunpower.demo', phone: '9000000004', role: Role.TECHNICIAN },
  { name: 'Meera Iyer', email: 'meera@sunpower.demo', phone: '9000000005', role: Role.SUPPORT },
];

async function main() {
  const passwordHash = await bcrypt.hash('demo1234', 12);

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, phone: user.phone, role: user.role, passwordHash, isActive: true },
      create: { ...user, passwordHash },
    });
  }

  console.log(`Seeded ${demoUsers.length} documented SunFlow demo users.`);
}

main()
  .catch((error) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
