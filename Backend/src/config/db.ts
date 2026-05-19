import { prisma } from '../prisma/client'; 

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL Connected...');
  } catch (err: any) {
    console.error('❌ Database connection error:', err);
    console.error('Error code:', err?.errorCode);
    console.error('Error message:', err?.message);
    
    // Provide helpful guidance
    if (err?.errorCode === 'P1001') {
      console.error('\n💡 Troubleshooting tips:');
      console.error('1. Check if your Aiven database is running');
      console.error('2. Verify the connection string in .env file');
      console.error('3. For Aiven, you may need to use the connection pooler URL instead of direct connection');
      console.error('4. Check Aiven dashboard → Service → Connection Information for the correct URL');
      console.error('5. Ensure your IP is whitelisted in Aiven firewall settings (if applicable)');
    }
    
    process.exit(1);
  }
};
