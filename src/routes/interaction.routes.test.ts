import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';
import { InteractionStatus, InteractionType } from '@prisma/client';

const prisma = new PrismaClient();

describe('interaction.routes', () => {
  let testAgentId: string;
  let createdInteractionIds: string[] = [];

  beforeAll(async () => {
    // Create a test agent scoped to this suite — never wipe the shared table
    const agent = await prisma.agent.create({
      data: {
        name: `Test Agent ${Date.now()}`,
        email: `test-${Date.now()}-${Math.random()}@example.com`,
      },
    });
    testAgentId = agent.id;
  });

  afterAll(async () => {
    // Delete children before the parent to satisfy interactions_agent_id_fkey
    if (createdInteractionIds.length > 0) {
      await prisma.interaction.deleteMany({
        where: { id: { in: createdInteractionIds } },
      });
    }
    await prisma.agent.delete({ where: { id: testAgentId } });
    await prisma.$disconnect();
  });

  describe('POST /api/interactions', () => {
    it('returns 201 on successful interaction creation', async () => {
      const response = await request(app)
        .post('/api/interactions')
        .send({
          agentId: testAgentId,
          type: 'llamada',
          openedAt: '2026-01-15T10:30:00Z',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        type: 'llamada',
        status: 'abierta',
      });
      expect(response.body).toHaveProperty('id');
      createdInteractionIds.push(response.body.id);
    });

    it('returns 400 on validation failure (missing required fields)', async () => {
      const response = await request(app).post('/api/interactions').send({});

      expect(response.status).toBe(400);
      expect(response.body.statusCode).toBe(400);
    });

    it('returns 400 when agentId does not exist', async () => {
      const response = await request(app)
        .post('/api/interactions')
        .send({
          agentId: '00000000-0000-0000-0000-000000000000',
          type: 'llamada',
        });

      expect(response.status).toBe(400);
      expect(response.body.statusCode).toBe(400);
    });

    it('returns 400 for invalid type value', async () => {
      const response = await request(app)
        .post('/api/interactions')
        .send({
          agentId: testAgentId,
          type: 'invalid',
        });

      expect(response.status).toBe(400);
    });

    it('defaults openedAt to current timestamp when not provided', async () => {
      const response = await request(app)
        .post('/api/interactions')
        .send({
          agentId: testAgentId,
          type: 'ticket',
        });

      expect(response.status).toBe(201);
      expect(response.body.openedAt).toBeDefined();
      createdInteractionIds.push(response.body.id);
    });
  });

  describe('PATCH /api/interactions/:id/status', () => {
    let interactionId: string;

    beforeAll(async () => {
      // Create an interaction directly in the database
      const interaction = await prisma.interaction.create({
        data: {
          agentId: testAgentId,
          type: InteractionType.LLAMADA,
          status: InteractionStatus.ABIERTA,
        },
      });
      interactionId = interaction.id;
      createdInteractionIds.push(interactionId);
    });

    it('returns 200 on successful status update', async () => {
      const response = await request(app)
        .patch(`/api/interactions/${interactionId}/status`)
        .send({
          status: 'en_progreso',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('en_progreso');
    });

    it('returns 400 on invalid status transition', async () => {
      // First update to en_progreso
      await request(app)
        .patch(`/api/interactions/${interactionId}/status`)
        .send({ status: 'en_progreso' });

      // Then try invalid transition to abierta
      const response = await request(app)
        .patch(`/api/interactions/${interactionId}/status`)
        .send({ status: 'abierta' });

      expect(response.status).toBe(400);
      expect(response.body.statusCode).toBe(400);
    });

    it('returns 404 for non-existent interaction', async () => {
      const response = await request(app)
        .patch('/api/interactions/00000000-0000-0000-0000-000000000000/status')
        .send({ status: 'en_progreso' });

      expect(response.status).toBe(404);
      expect(response.body.statusCode).toBe(404);
    });

    it('sets closedAt when transitioning to resuelta', async () => {
      // First update to en_progreso
      await request(app)
        .patch(`/api/interactions/${interactionId}/status`)
        .send({ status: 'en_progreso' });

      // Then update to resuelta
      const response = await request(app)
        .patch(`/api/interactions/${interactionId}/status`)
        .send({ status: 'resuelta' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('resuelta');
      expect(response.body.closedAt).toBeDefined();
    });
  });

  describe('GET /api/interactions', () => {
    let interactionId: string;

    beforeAll(async () => {
      // Create an interaction directly in the database
      const interaction = await prisma.interaction.create({
        data: {
          agentId: testAgentId,
          type: InteractionType.LLAMADA,
          status: InteractionStatus.ABIERTA,
        },
      });
      interactionId = interaction.id;
      createdInteractionIds.push(interactionId);
    });

    it('returns 200 with paginated results', async () => {
      const response = await request(app).get('/api/interactions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
      expect(response.body).toHaveProperty('totalPages');
    });

    it('applies agentId filter', async () => {
      const response = await request(app)
        .get('/api/interactions')
        .query({ agentId: testAgentId });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('applies status filter', async () => {
      const response = await request(app)
        .get('/api/interactions')
        .query({ status: 'abierta' });

      expect(response.status).toBe(200);
    });

    it('applies type filter', async () => {
      const response = await request(app)
        .get('/api/interactions')
        .query({ type: 'llamada' });

      expect(response.status).toBe(200);
    });

    it('returns 400 when startDate > endDate', async () => {
      const response = await request(app)
        .get('/api/interactions')
        .query({
          startDate: '2026-01-15',
          endDate: '2026-01-10',
        });

      expect(response.status).toBe(400);
      expect(response.body.statusCode).toBe(400);
    });

    it('defaults page to 1 and pageSize to 10 when not provided', async () => {
      const response = await request(app).get('/api/interactions');

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(10);
    });

    it('handles empty results correctly', async () => {
      // Create a new agent and try to list interactions for it
      const newAgent = await prisma.agent.create({
        data: {
          name: 'Empty Agent',
          email: `empty-${Date.now()}@example.com`,
        },
      });

      const response = await request(app)
        .get('/api/interactions')
        .query({ agentId: newAgent.id });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);

      // Clean up
      await prisma.agent.delete({ where: { id: newAgent.id } });
    });
  });
});
