import { PrismaClient } from '@prisma/client';
import { SuiService } from '../services/sui-service';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample organizations
  const organizations = await Promise.all([
    prisma.apiKey.upsert({
      where: { key: 'org_techcorp_2024' },
      update: {},
      create: {
        key: 'org_techcorp_2024',
        organization: 'TechCorp Inc.',
        rateLimit: 5000,
        isActive: true,
      },
    }),
    prisma.apiKey.upsert({
      where: { key: 'org_web3dao_2024' },
      update: {},
      create: {
        key: 'org_web3dao_2024',
        organization: 'Web3 DAO',
        rateLimit: 10000,
        isActive: true,
      },
    }),
  ]);

  console.log('Created organizations:', organizations.map(org => org.organization));

  // Register verifiers on blockchain
  const suiService = new SuiService();
  
  // Note: In production, you'd use actual verifier addresses
  console.log('Skipping blockchain verifier registration in seed (requires actual addresses)');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });