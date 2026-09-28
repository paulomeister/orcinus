import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { listAgents } from './agent.service';
import { findAll } from '../repositories/agent.repository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('listAgents', () => {
  let createdAgentIds: string[] = [];

  afterAll(async () => {
    // Clean up only the agents we created
    if (createdAgentIds.length > 0) {
      await prisma.agent.deleteMany({
        where: { id: { in: createdAgentIds } },
      });
    }
    await prisma.$disconnect();
  });

  it('returns agents ordered by name when they exist', async () => {
  const uniquePrefix = `Zz${Date.now()}`; // sorts after any pre-existing agent names
  const agent1 = await prisma.agent.create({
    data: { name: `${uniquePrefix}-Charlie`, email: `charlie-${Date.now()}@example.com` },
  });
  createdAgentIds.push(agent1.id);

  const agent2 = await prisma.agent.create({
    data: { name: `${uniquePrefix}-Alice`, email: `alice-${Date.now()}@example.com` },
  });
  createdAgentIds.push(agent2.id);

  const agent3 = await prisma.agent.create({
    data: { name: `${uniquePrefix}-Bob`, email: `bob-${Date.now()}@example.com` },
  });
  createdAgentIds.push(agent3.id);

  const result = await listAgents();
  const ours = result.filter((a) => a.name.startsWith(uniquePrefix));

  expect(ours.length).toBe(3);
  expect(ours[0]?.name).toBe(`${uniquePrefix}-Alice`);
  expect(ours[1]?.name).toBe(`${uniquePrefix}-Bob`);
  expect(ours[2]?.name).toBe(`${uniquePrefix}-Charlie`);
  });

  it('passthrough works: returns same result as repository.findAll()', async () => {
    // Create a test agent
    const agent = await prisma.agent.create({
      data: {
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
