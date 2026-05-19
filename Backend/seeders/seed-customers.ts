import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

interface CustomerSeedData {
  email: string;
  password: string;
  name?: string;
  phone_number?: string;
  mobile_number?: string;
  address?: string;
}

const customersToSeed: CustomerSeedData[] = [
  {
    email: 'customer@manpasand.com',
    password: 'customer123',
    name: 'John Doe',
    phone_number: '021-1234567',
    mobile_number: '0300-1234567',
    address: '123 Main Street, Karachi',
  },
  {
    email: 'test@manpasand.com',
    password: 'test123',
    name: 'Jane Smith',
    phone_number: '021-9876543',
    mobile_number: '0300-9876543',
    address: '456 Park Avenue, Lahore',
  },
];

async function seedCustomers() {
  console.log('🌱 Starting customer seeder...\n');

  try {
    console.log('📝 Creating customers...\n');

    // Create customers
    for (const customerData of customersToSeed) {
      // Check if customer already exists
      const existingCustomer = await prisma.customer.findFirst({
        where: { email: customerData.email },
      });

      if (existingCustomer) {
        console.log(`⚠️  Customer already exists: ${customerData.email} - Skipping`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(customerData.password, 10);

      // Create customer
      const customer = await prisma.customer.create({
        data: {
          email: customerData.email,
          password: hashedPassword,
          name: customerData.name,
          phone_number: customerData.phone_number,
          mobile_number: customerData.mobile_number,
          address: customerData.address,
          is_active: true,
        },
      });

      console.log(`✅ Created customer: ${customerData.email} - Name: ${customerData.name || 'N/A'}`);
    }

    console.log('\n📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test Customer 1:');
    console.log('  Email: customer@manpasand.com');
    console.log('  Password: customer123');
    console.log('  Name: John Doe');
    console.log('');
    console.log('Test Customer 2:');
    console.log('  Email: test@manpasand.com');
    console.log('  Password: test123');
    console.log('  Name: Jane Smith');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Customer seeder completed successfully!');
  } catch (error) {
    console.error('\n❌ Error seeding customers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeder
seedCustomers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

