import { PrismaClient, InteractionType, InteractionStatus } from '@prisma/client';

const prisma = new PrismaClient();

const AGENTS = [
  { name: 'Carlos Gómez', email: 'carlos@wesmile.co' },
  { name: 'María López', email: 'maria@wesmile.co' },
  { name: 'Andrés Ramírez', email: 'andres@wesmile.co' },
  { name: 'Laura Martínez', email: 'laura@wesmile.co' },
  { name: 'Lucas Pacioli', email: 'lucas@wesmile.co' },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  // Delete existing data (respecting FK order)
  await prisma.interaction.deleteMany();
  await prisma.agent.deleteMany();

  // Create agents
  const agents = await Promise.all(
    AGENTS.map((agent) =>
      prisma.agent.create({
        data: agent,
      })
    )
  );

  console.log(`Created ${agents.length} agents`);

  // Generate interactions for each agent
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() - 1); // Yesterday
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 13); // 14-day window
  startDate.setHours(0, 0, 0, 0);

  const types = [InteractionType.LLAMADA, InteractionType.TICKET];
  const statuses = [
    InteractionStatus.RESUELTA,
    InteractionStatus.EN_PROGRESO,
    InteractionStatus.ABIERTA,
  ];

  let totalInteractions = 0;

  for (const agent of agents) {
    const interactionCount = randomInt(60, 80);

    for (let i = 0; i < interactionCount; i++) {
      // Determine type (~50/50 split)
      const type = randomChoice(types);

      // Determine status (40% resuelta, 30% en_progreso, 30% abierta)
      const statusRandom = Math.random();
      let status: InteractionStatus;
      if (statusRandom < 0.4) {
        status = InteractionStatus.RESUELTA;
      } else if (statusRandom < 0.7) {
        status = InteractionStatus.EN_PROGRESO;
      } else {
        status = InteractionStatus.ABIERTA;
      }

      // Determine time of day (07:00-23:59 Colombia time, with ~15% between 22:00-01:00)
      const hour = Math.random() < 0.15
        ? randomInt(22, 25) % 24 // 22:00-01:00 (midnight boundary cases)
        : randomInt(7, 23); // 07:00-23:59

      const minute = randomInt(0, 59);
      const second = randomInt(0, 59);

      // Create date in Colombia timezone (UTC-5)
      const openedAt = randomDate(startDate, endDate);
      openedAt.setHours(hour, minute, second, 0);

      // Convert to UTC (add 5 hours)
      const openedAtUTC = new Date(openedAt.getTime() + 5 * 60 * 60 * 1000);

      // For resolved interactions, set closedAt
      let closedAt: Date | null = null;
      if (status === InteractionStatus.RESUELTA) {
        const resolutionMinutes = randomInt(5, 120);
        closedAt = new Date(openedAtUTC.getTime() + resolutionMinutes * 60 * 1000);
      }

      await prisma.interaction.create({
        data: {
          agentId: agent.id,
          type,
          status,
          openedAt: openedAtUTC,
          closedAt,
        },
      });

      totalInteractions++;
    }
  }

  console.log(`Created ${totalInteractions} interactions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
