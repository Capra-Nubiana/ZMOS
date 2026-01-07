const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

async function checkMembers() {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const dbPath = dbUrl.replace('file:', '');
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  const prisma = new PrismaClient({ adapter });

  try {
    const members = await prisma.member.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        profileCompleted: true,
      },
    });

    console.log('\n=== Current Members in Database ===');
    if (members.length === 0) {
      console.log('No members found');
    } else {
      members.forEach((member, index) => {
        console.log(`\n${index + 1}. ${member.email}`);
        console.log(`   ID: ${member.id}`);
        console.log(`   Name: ${member.name}`);
        console.log(`   Role: ${member.role}`);
        console.log(`   Tenant ID: ${member.tenantId}`);
        console.log(`   Profile Completed: ${member.profileCompleted}`);
      });
    }
    console.log('\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMembers();
