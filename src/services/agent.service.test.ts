import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { listAgents } from './agent.service';
import { findAll } from '../repositories/agent.repository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('listAgents', () => {
  beforeAll(async () => {
    // Clean up any existing agents
    await prisma.agent.deleteMany({});
  });

  afterAll(async () => {
    // Clean up
    await prisma.agent.deleteMany({});
    await prisma.$disconnect();
  });

  it('returns an empty array when no agents exist', async () => {
    const result = await listAgents();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });

  it('returns agents ordered by name when they exist', async () => {
    // Create test agents in non-alphabetical order
    await prisma.agent.create({
      data: {
        id: 'agent-3',
        name: 'Charlie',
        email: 'charlie@example.com',
      },
    });
    await prisma.agent.create({
      data: {
        id: 'agent-1',
        name: 'Alice',
        email: 'alice@example.com',
      },
    });
    await prisma.agent.create({
      data: {
        id: 'agent-2',
        name: 'Bob',
        email: 'bob@example.com',
      },
    });

    const result = await listAgents();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result[0]?.name).toBe('Alice');
    expect(result[1]?.name).toBe('Bob');
    expect(result[2]?.name).toBe('Charlie');
  });

  it('passthrough works: returns same result as repository.findAll()', async () => {
    // Create a test agent
    await prisma.agent.create({
      data: {
        id: 'agent-test',
        name: 'Test Agent',
        email: 'test@example.com',
      },
    });

    const serviceResult = await listAgents();
    const repositoryResult = await findAll();

    expect(serviceResult).toEqual(repositoryResult);
  });
});
