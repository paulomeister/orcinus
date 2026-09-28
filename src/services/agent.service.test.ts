import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { listAgents } from './agent.service';
import { findAll } from '../repositories/agent.repository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('listAgents', () => {
  let createdAgentIds: string[] = [];

  beforeAll(async () => {
    // Clean up any existing agents
    await prisma.agent.deleteMany({});
  });

  afterAll(async () => {
    // Clean up only the agents we created
    if (createdAgentIds.length > 0) {
      await prisma.agent.deleteMany({
        where: { id: { in: createdAgentIds } },
      });
    }
    await prisma.$disconnect();
  });

  it('returns an empty array when no agents exist', async () => {
    const result = await listAgents();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });

  it('returns agents ordered by name when they exist', async () => {
    // Create test agents in non-alphabetical order
    const agent1 = await prisma.agent.create({
      data: {
        id: `agent-${Date.now()}-charlie`,
        name: 'Charlie',
        email: `charlie-${Date.now()}@example.com`,
      },
    });
    createdAgentIds.push(agent1.id);

    const agent2 = await prisma.agent.create({
      data: {
        id: `agent-${Date.now()}-alice`,
        name: 'Alice',
        email: `alice-${Date.now()}@example.com`,
      },
    });
    createdAgentIds.push(agent2.id);

    const agent3 = await prisma.agent.create({
      data: {
        id: `agent-${Date.now()}-bob`,
        name: 'Bob',
        email: `bob-${Date.now()}@example.com`,
      },
    });
    createdAgentIds.push(agent3.id);

    const result = await listAgents();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result[0]?.name).toBe('Alice');
    expect(result[1]?.name).toBe('Bob');
    expect(result[2]?.name).toBe('Charlie');
  });

  it('passthrough works: returns same result as repository.findAll()', async () => {
    // Create a test agent
    const agent = await prisma.agent.create({
      data: {
        id: `agent-${Date.now()}-test`,
        name: 'Test Agent',
        email: `test-${Date.now()}@example.com`,
      },
    });
    createdAgentIds.push(agent.id);

    const serviceResult = await listAgents();
    const repositoryResult = await findAll();

    expect(serviceResult).toEqual(repositoryResult);
  });
});
