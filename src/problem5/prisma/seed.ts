import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.task.deleteMany();

  // Create sample tasks
  const tasks = await prisma.task.createMany({
    data: [
      {
        title: 'Complete project documentation',
        description: 'Write comprehensive README and API documentation',
        status: 'completed',
      },
      {
        title: 'Implement user authentication',
        description: 'Add JWT-based authentication system',
        status: 'in_progress',
      },
      {
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment',
        status: 'pending',
      },
      {
        title: 'Write unit tests',
        description: 'Add test coverage for all endpoints',
        status: 'pending',
      },
      {
        title: 'Deploy to production',
        description: 'Deploy the API server to cloud platform',
        status: 'pending',
      },
    ],
  });

  console.log(`✅ Created ${tasks.count} tasks`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
