import prisma from '../lib/prisma';

export interface Agent {
  id: string;
  name: string;
  email: string;
}

export async function findAll(): Promise<Agent[]> {
  const agents = await prisma.agent.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return agents;
}

export async function findById(id: string): Promise<Agent | null> {
  return prisma.agent.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}
