import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Update all locations to Kenya
  const result = await prisma.location.updateMany({
    data: {
      country: 'KE',
    },
  });

  console.log(`Updated ${result.count} locations to Kenya (KE)`);

  // Verify
  const locations = await prisma.location.findMany({
    select: {
      id: true,
      name: true,
      country: true,
      tenant: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log('\nLocations:');
  locations.forEach((loc) => {
    console.log(`- ${loc.name} (${loc.country}) - Tenant: ${loc.tenant.name}`);
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
