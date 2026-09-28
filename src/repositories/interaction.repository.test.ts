import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { create, findById, findMany, count, updateStatus } from './interaction.repository';
import { InteractionStatus, InteractionType } from '@prisma/client';

const prisma = new PrismaClient();

describe('interaction.repository', () => {
  let testAgentId: string;

  beforeAll(async () => {
    // Clean up first
    await prisma.interaction.deleteMany({});
    await prisma.agent.deleteMany({});

    // Create a test agent
    const agent = await prisma.agent.create({
      data: {
        name: 'Test Agent',
        email: `test-${Date.now()}@example.com`,
      },
    });
    testAgentId = agent.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.interaction.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up interactions before each test
    await prisma.interaction.deleteMany({});
  });

  afterEach(async () => {
    // Clean up interactions after each test
    await prisma.interaction.deleteMany({});
  });

  describe('create', () => {
    it('creates an interaction with required fields', async () => {
      const result = await create({
        agentId: testAgentId,
        type: InteractionType.LLAMADA,
      });

      expect(result).toMatchObject({
        agentId: testAgentId,
        type: InteractionType.LLAMADA,
        status: InteractionStatus.ABIERTA,
      });
      expect(result.id).toBeDefined();
      expect(result.openedAt).toBeInstanceOf(Date);
      expect(result.closedAt).toBeNull();
    });

    it('creates an interaction with optional openedAt', async () => {
      const customDate = new Date('2026-01-15T10:30:00Z');
      const result = await create({
        agentId: testAgentId,
        type: InteractionType.TICKET,
        openedAt: customDate,
      });

      expect(result.openedAt?.toISOString()).toBe(customDate.toISOString());
      expect(result.type).toBe(InteractionType.TICKET);
    });
  });

  describe('findById', () => {
    let createdInteractionId: string;

    beforeEach(async () => {
      const interaction = await prisma.interaction.create({
        data: {
          agentId: testAgentId,
          type: InteractionType.LLAMADA,
          status: InteractionStatus.ABIERTA,
        },
      });
      createdInteractionId = interaction.id;
    });

    it('returns the interaction if found', async () => {
      const result = await findById(createdInteractionId);

      expect(result).toMatchObject({
        id: createdInteractionId,
        agentId: testAgentId,
      });
    });

    it('returns null for non-existent UUID', async () => {
      const result = await findById('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('returns all interactions when no filters applied', async () => {
      // Create exactly 5 interactions for testing
      for (let i = 0; i < 5; i++) {
        await prisma.interaction.create({
          data: {
            agentId: testAgentId,
            type: i % 2 === 0 ? InteractionType.LLAMADA : InteractionType.TICKET,
            status: i < 2 ? InteractionStatus.ABIERTA : InteractionStatus.EN_PROGRESO,
            openedAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
          },
        });
      }

      const result = await findMany({}, { page: 1, pageSize: 10 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
    });

    it('returns paginated results', async () => {
      // Create 5 interactions
      for (let i = 0; i < 5; i++) {
        await prisma.interaction.create({
          data: {
            agentId: testAgentId,
            type: InteractionType.LLAMADA,
            status: InteractionStatus.ABIERTA,
            openedAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
          },
        });
      }

      const result = await findMany({}, { page: 1, pageSize: 3 });

      expect(result.length).toBe(3);
    });

    it('returns correct subset with pagination metadata', async () => {
      // Create 5 interactions
      for (let i = 0; i < 5; i++) {
        await prisma.interaction.create({
          data: {
            agentId: testAgentId,
            type: InteractionType.LLAMADA,
            status: InteractionStatus.ABIERTA,
            openedAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
          },
        });
      }

      const result1 = await findMany({}, { page: 1, pageSize: 3 });
      const result2 = await findMany({}, { page: 2, pageSize: 3 });

      expect(result1.length).toBe(3);
      expect(result2.length).toBe(2);
      expect(result1[0]?.id).not.toBe(result2[0]?.id);
    });

    it('filters by agentId', async () => {
      // Create 5 interactions
      for (let i = 0; i < 5; i++) {
        await prisma.interaction.create({
          data: {
            agentId: testAgentId,
            type: InteractionType.LLAMADA,
            status: InteractionStatus.ABIERTA,
            openedAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
          },
        });
      }

      const result = await findMany({ agentId: testAgentId }, { page: 1, pageSize: 10 });
      expect(result.length).toBe(5);
    });

    it('filters by status', async () => {
      // Create 5 interactions with mixed statuses
      for (let i = 0; i < 5; i++) {
        await prisma.interaction.create({
          data: {
            agentId: testAgentId,
            type: InteractionType.LLAMADA,
            status: i < 2 ? InteractionStatus.ABIERTA : InteractionStatus.EN_PROGRESO,
            openedAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
          },
        });
      }

      const result = await findMany({ status: InteractionStatus.ABIERTA }, { page: 1, pageSize: 10 });
      expect(result.length).toBe(2);
    });

    it('filters by type', async () => {
      // Create 5 interactions with mixed types
      for (let i = 0; i < 5; i++) {
        await prisma.interaction.create({
          data: {
            agentId: testAgentId,
            type: i % 2 === 0 ? InteractionType.LLAMADA : InteractionType.TICKET,
            status: InteractionStatus.ABIERTA,
            openedAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
          },
        });
      }

      const result = await findMany({ type: InteractionType.LLAMADA }, { page: 1, pageSize: 10 });
      expect(result.length).toBe(3);
    });

    it('includes agent relation with name', async () => {
      // Create 5 interactions
      for (let i = 0; i < 5; i++) {
        await prisma.interaction.create({
          data: {
            agentId: testAgentId,
            type: InteractionType.LLAMADA,
            status: InteractionStatus.ABIERTA,
            openedAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
          },
        });
      }

      const result = await findMany({}, { page: 1, pageSize: 10 });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('agent');
      expect(result[0]?.agent).toHaveProperty('name');
    });
  });

  describe('count', () => {
    it('returns total count without filters', async () => {
      // Create exactly 3 interactions
      for (let i = 0; i < 3; i++) {
        await prisma.interaction.create({
          data: {
            agentId: testAgentId,
            type: InteractionType.LLAMADA,
            status: InteractionStatus.ABIERTA,
            openedAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
          },
        });
      }

      const result = await count({});
      expect(result).toBe(3);
    });

    it('filters by status', async () => {
      // Create 3 interactions with mixed statuses
      for (let i = 0; i < 3; i++) {
        await prisma.interaction.create({
          data: {
            agentId: testAgentId,
            type: InteractionType.LLAMADA,
            status: i === 0 ? InteractionStatus.ABIERTA : InteractionStatus.EN_PROGRESO,
            openedAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
          },
        });
      }

      const result = await count({ status: InteractionStatus.ABIERTA });
      expect(result).toBe(1);
    });

    it('filters by type', async () => {
      // Create 3 interactions with mixed types
      for (let i = 0; i < 3; i++) {
        await prisma.interaction.create({
          data: {
            agentId: testAgentId,
            type: i === 0 ? InteractionType.LLAMADA : InteractionType.TICKET,
            status: InteractionStatus.ABIERTA,
            openedAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
          },
        });
      }

      const result = await count({ type: InteractionType.LLAMADA });
      expect(result).toBe(2);
    });

    it('count matches findMany without pagination', async () => {
      // Create 3 interactions
      for (let i = 0; i < 3; i++) {
        await prisma.interaction.create({
          data: {
            agentId: testAgentId,
            type: InteractionType.LLAMADA,
            status: InteractionStatus.ABIERTA,
            openedAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
          },
        });
      }

      const [countResult, findManyResult] = await Promise.all([
        count({}),
        findMany({}, { page: 1, pageSize: 10 }),
      ]);

      expect(countResult).toBe(findManyResult.length);
    });
  });

  describe('updateStatus', () => {
    let testInteractionId: string;

    beforeEach(async () => {
      const interaction = await prisma.interaction.create({
        data: {
          agentId: testAgentId,
          type: InteractionType.LLAMADA,
          status: InteractionStatus.ABIERTA,
        },
      });
      testInteractionId = interaction.id;
    });

    it('updates status and returns updated record', async () => {
      const result = await updateStatus(testInteractionId, {
        status: InteractionStatus.EN_PROGRESO,
      });

      expect(result.status).toBe(InteractionStatus.EN_PROGRESO);
      expect(result.closedAt).toBeNull();
    });

    it('sets closedAt when transitioning to RESUELTA', async () => {
      const result = await updateStatus(testInteractionId, {
        status: InteractionStatus.RESUELTA,
        closedAt: new Date(),
      });

      expect(result.status).toBe(InteractionStatus.RESUELTA);
      expect(result.closedAt).toBeInstanceOf(Date);
    });
  });
});
