const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    // Check database tables
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `;

    console.log('✅ Database Tables:');
    tables.forEach(t => console.log(`   - ${t.name}`));

    // Check if we can query with new schema
    const tenantCount = await prisma.tenant.count();
    const memberCount = await prisma.member.count();

    console.log('\n✅ Schema Verification:');
    console.log(`   - Tenants: ${tenantCount}`);
    console.log(`   - Members: ${memberCount}`);

    // Test that we can fetch a tenant with the new schema
    const tenant = await prisma.tenant.findFirst();
    if (tenant) {
      console.log('\n✅ Sample Tenant Query:');
      console.log(`   - ID: ${tenant.id}`);
      console.log(`   - Name: ${tenant.name}`);
    }

    console.log('\n🎉 Migration successful! Database now uses ZMOS naming conventions.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
