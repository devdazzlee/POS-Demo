import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

interface UserSeedData {
  email: string;
  password: string;
  role: Role;
  branchName?: string;
  branchCode?: string;
}

const usersToSeed: UserSeedData[] = [
  {
    email: 'admin@acestudios.com',
    password: 'Admin@123',
    role: Role.SUPER_ADMIN,
  },
  {
    email: 'branch@acestudios.com',
    password: 'Branch@123',
    role: Role.BRANCH_MANAGER,
    branchName: 'ACE Studios Main',
    branchCode: 'ACE-001',
  },
];

async function seedAceUsers() {
  console.log('Seeding ACE STUDIOS users...\n');

  const branches = new Map<string, string>();

  for (const userData of usersToSeed) {
    if (userData.branchCode && userData.branchName) {
      let branch = await prisma.branch.findUnique({
        where: { code: userData.branchCode },
      });

      if (!branch) {
        branch = await prisma.branch.create({
          data: {
            code: userData.branchCode,
            name: userData.branchName,
            is_active: true,
            branch_type: 'BRANCH',
          },
        });
        console.log(`Created branch: ${userData.branchName} (${userData.branchCode})`);
      } else {
        console.log(`Branch already exists: ${userData.branchName} (${userData.branchCode})`);
      }

      branches.set(userData.branchCode, branch.id);
    }
  }

  for (const userData of usersToSeed) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const branchId = userData.branchCode ? branches.get(userData.branchCode) : null;

    if (existingUser) {
      await prisma.user.update({
        where: { email: userData.email },
        data: {
          password: hashedPassword,
          role: userData.role,
          branch_id: branchId || null,
        },
      });
      console.log(`Updated user: ${userData.email} (${userData.role})`);
    } else {
      await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          branch_id: branchId || null,
        },
      });
      console.log(`Created user: ${userData.email} (${userData.role})`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ACE STUDIOS Login Credentials');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin');
  console.log('  Username : admin@acestudios.com');
  console.log('  Password : Admin@123');
  console.log('  Role     : SUPER_ADMIN');
  console.log('');
  console.log('Branch');
  console.log('  Username : branch@acestudios.com');
  console.log('  Password : Branch@123');
  console.log('  Role     : BRANCH_MANAGER');
  console.log('  Branch   : ACE Studios Main (ACE-001)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seedAceUsers()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Fatal error:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
