const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 Database Contents:\n');

  // Count records in each table
  const tenantCount = await prisma.tenant.count();
  const memberCount = await prisma.member.count();
  const locationCount = await prisma.location.count();
  const sessionTypeCount = await prisma.sessionType.count();
  const sessionInstanceCount = await prisma.sessionInstance.count();
  const bookingCount = await prisma.booking.count();

  console.log(`Tenants: ${tenantCount}`);
  console.log(`Members: ${memberCount}`);
  console.log(`Locations: ${locationCount}`);
  console.log(`Session Types: ${sessionTypeCount}`);
  console.log(`Session Instances: ${sessionInstanceCount}`);
  console.log(`Bookings: ${bookingCount}`);

  if (tenantCount > 0) {
    console.log('\n🏢 Tenants:');
    const tenants = await prisma.tenant.findMany();
    tenants.forEach(t => console.log(`  - ${t.name} (ID: ${t.id})`));
  }

  if (memberCount > 0) {
    console.log('\n👥 Members:');
    const members = await prisma.member.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        googleId: true,
        tenantId: true,
        role: true
      }
    });
    members.forEach(m => {
      const googleIdStr = m.googleId || 'N/A';
      console.log(`  - ${m.email} (${m.name}) - Role: ${m.role}, GoogleID: ${googleIdStr}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
