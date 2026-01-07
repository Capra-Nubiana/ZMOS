const { PrismaClient } = require('./src/generated/client.ts');

async function testDB() {
  const prisma = new PrismaClient();
  try {
    console.log('Testing SQLite database connection...');
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Test tenant creation
    console.log('Creating test tenant...');
    const tenant = await prisma.tenant.create({
      data: { name: 'Test Tenant' }
    });
    console.log('✅ Tenant created:', tenant.id);
    
    console.log('🎉 Database test successful!');
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
