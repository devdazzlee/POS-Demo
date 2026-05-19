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
    email: 'admin',
    password: 'Admin123',
    role: Role.SUPER_ADMIN,
  },
  {
    email: 'bahadurabad',
    password: 'Branch123',
    role: Role.BRANCH_MANAGER,
    branchName: 'Bahadurabad',
    branchCode: 'BRANCH-001',
  },
  {
    email: 'dha',
    password: 'Branch123',
    role: Role.BRANCH_MANAGER,
    branchName: 'DHA',
    branchCode: 'BRANCH-002',
  },
  {
    email: 'bahria',
    password: 'Branch123',
    role: Role.BRANCH_MANAGER,
    branchName: 'Bahria Town',
    branchCode: 'BRANCH-003',
  },
  {
    email: 'bahriatown',
    password: 'Branch123',
    role: Role.BRANCH_MANAGER,
    branchName: 'Bahria Town North',
    branchCode: 'BRANCH-004',
  },
  {
    email: 'warehouse',
    password: 'Warehouse123',
    role: Role.WAREHOUSE_MANAGER,
    branchName: 'Main Warehouse',
    branchCode: 'WAREHOUSE-001',
  },
];

async function seedUsers() {
  console.log('🌱 Starting user seeder...\n');

  try {
    // Create branches first if they don't exist
    const branches = new Map<string, string>(); // Map branch code to branch ID

    for (const userData of usersToSeed) {
      if (userData.branchCode && userData.branchName) {
        let branch = await prisma.branch.findUnique({
          where: { code: userData.branchCode },
        });

        if (!branch) {
          const isWarehouse = userData.branchCode.startsWith('WAREHOUSE');
          branch = await prisma.branch.create({
            data: {
              code: userData.branchCode,
              name: userData.branchName,
              is_active: true,
              branch_type: isWarehouse ? 'WAREHOUSE' : 'BRANCH',
            },
          });
          console.log(`✅ Created branch: ${userData.branchName} (${userData.branchCode})`);
        } else {
          console.log(`ℹ️  Branch already exists: ${userData.branchName} (${userData.branchCode})`);
        }

        branches.set(userData.branchCode, branch.id);
      }
    }

    console.log('\n📝 Creating users...\n');

    // Create users
    for (const userData of usersToSeed) {
      // Check if user already exists — try to find and update if exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Get branch_id if user has a branch
      const branchId = userData.branchCode
        ? branches.get(userData.branchCode)
        : null;

      if (existingUser) {
        // Update existing user with new password and branch
        await prisma.user.update({
          where: { email: userData.email },
          data: {
            password: hashedPassword,
            role: userData.role,
            branch_id: branchId || null,
          },
        });

        const branchInfo = branchId
          ? ` (Branch: ${userData.branchName})`
          : ' (No branch - Super Admin)';

        console.log(
          `🔄 Updated existing user: ${userData.email} - Role: ${userData.role}${branchInfo}`
        );
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            role: userData.role,
            branch_id: branchId || null,
          },
        });

        const branchInfo = branchId
          ? ` (Branch: ${userData.branchName})`
          : ' (No branch - Super Admin)';

        console.log(
          `✅ Created user: ${userData.email} - Role: ${userData.role}${branchInfo}`
        );
      }
    }

    console.log('\n📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Super Admin:');
    console.log('  Username : admin');
    console.log('  Password : Admin123');
    console.log('  Role     : SUPER_ADMIN');
    console.log('');
    console.log('Branch 1 - Bahadurabad:');
    console.log('  Username : bahadurabad');
    console.log('  Password : Branch123');
    console.log('  Role     : BRANCH_MANAGER');
    console.log('  Branch   : Bahadurabad (BRANCH-001)');
    console.log('');
    console.log('Branch 2 - DHA:');
    console.log('  Username : dha');
    console.log('  Password : Branch123');
    console.log('  Role     : BRANCH_MANAGER');
    console.log('  Branch   : DHA (BRANCH-002)');
    console.log('');
    console.log('Branch 3 - Bahria Town:');
    console.log('  Username : bahria');
    console.log('  Password : Branch123');
    console.log('  Role     : BRANCH_MANAGER');
    console.log('  Branch   : Bahria Town (BRANCH-003)');
    console.log('');
    console.log('Branch 4 - Bahria Town North:');
    console.log('  Username : bahriatown');
    console.log('  Password : Branch123');
    console.log('  Role     : BRANCH_MANAGER');
    console.log('  Branch   : Bahria Town North (BRANCH-004)');
    console.log('');
    console.log('Warehouse:');
    console.log('  Username : warehouse');
    console.log('  Password : Warehouse123');
    console.log('  Role     : WAREHOUSE_MANAGER');
    console.log('  Branch   : Main Warehouse (WAREHOUSE-001)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ User seeder completed successfully!');
  } catch (error) {
    console.error('\n❌ Error seeding users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeder
seedUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
