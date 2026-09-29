import { PrismaClient, InteractionType, InteractionStatus } from '@prisma/client';

const prisma = new PrismaClient();

const AGENTS = [
  { name: 'Carlos Gómez', email: 'carlos@wesmile.co' },
  { name: 'María López', email: 'maria@wesmile.co' },
  { name: 'Andrés Ramírez', email: 'andres@wesmile.co' },
  { name: 'Laura Martínez', email: 'laura@wesmile.co' },
  { name: 'Lucas Pacioli', email: 'lucas@wesmile.co' },
];

const BOGOTA_OFFSET = '-05:00';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)]!;
}

/**
 * Builds a UTC instant from a Colombia (America/Bogota, UTC-5) wall-clock
 * time. Bogota has no DST, so a fixed -05:00 offset is always correct.
 */
function bogotaDate(dateStr: string, hour: number, minute: number, second: number): Date {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const ss = String(second).padStart(2, '0');
  return new Date(`${dateStr}T${hh}:${mm}:${ss}${BOGOTA_OFFSET}`);
}

/** Adds (or subtracts) whole calendar days to a YYYY-MM-DD string, in UTC. */
function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
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

  // 14-day window ending yesterday, expressed as Colombia calendar dates
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = addDays(todayStr, -1);
  const startDateStr = addDays(yesterdayStr, -13); // 14-day window

  const types = [InteractionType.LLAMADA, InteractionType.TICKET];

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

      // Pick a Colombia calendar day within the 14-day window
      const dayStr = addDays(startDateStr, randomInt(0, 13));
      const minute = randomInt(0, 59);
      const second = randomInt(0, 59);

      // Time of day (07:00-23:59 Colombia time, with ~15% between 22:00-01:00
      // to exercise midnight boundary grouping)
      let openedAtUTC: Date;
      if (Math.random() < 0.15) {
        if (Math.random() < 0.5) {
          // 22:00-23:59 on dayStr
          openedAtUTC = bogotaDate(dayStr, randomInt(22, 23), minute, second);
        } else {
          // 00:00-01:59 on the following Colombia day
          openedAtUTC = bogotaDate(addDays(dayStr, 1), randomInt(0, 1), minute, second);
        }
      } else {
        openedAtUTC = bogotaDate(dayStr, randomInt(7, 23), minute, second);
      }

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

  // Deterministic midnight-boundary fixtures required by design.md:
  // - one interaction opened at 23:30:00-05:00 (stored as 04:30:00Z next day)
  // - one interaction opened at 00:15:00-05:00 the following day (stored as 05:15:00Z)
  const boundaryDay = addDays(startDateStr, 7); // safely inside the 14-day window
  const boundaryOpenedAt = bogotaDate(boundaryDay, 23, 30, 0);
  await prisma.interaction.create({
    data: {
      agentId: agents[0]!.id,
      type: InteractionType.LLAMADA,
      status: InteractionStatus.RESUELTA,
      openedAt: boundaryOpenedAt,
      closedAt: new Date(boundaryOpenedAt.getTime() + 20 * 60 * 1000),
    },
  });
  totalInteractions++;

  const nextBoundaryDay = addDays(boundaryDay, 1);
  await prisma.interaction.create({
    data: {
      agentId: agents[0]!.id,
      type: InteractionType.TICKET,
      status: InteractionStatus.ABIERTA,
      openedAt: bogotaDate(nextBoundaryDay, 0, 15, 0),
    },
  });
  totalInteractions++;

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