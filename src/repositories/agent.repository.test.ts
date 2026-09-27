import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { findAll } from './agent.repository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('findAll', () => {
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
    const result = await findAll();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });
});
