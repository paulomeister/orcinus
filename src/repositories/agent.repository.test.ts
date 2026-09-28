import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { findAll } from './agent.repository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('findAll', () => {
  afterAll(async () => {
  await prisma.$disconnect();
  });

  it('returns an array (baseline call succeeds)', async () => {
    const result = await findAll();
    expect(Array.isArray(result)).toBe(true);
  });
});