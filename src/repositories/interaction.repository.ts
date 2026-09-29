import { InteractionStatus, InteractionType, Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

export interface CreateInteractionData {
  agentId: string;
  type: InteractionType;
  openedAt?: Date;
}

export interface InteractionFilters {
  agentId?: string;
  status?: InteractionStatus;
  type?: InteractionType;
  /** Inclusive lower bound (already resolved to a UTC instant). */
  startDate?: Date;
  /** Exclusive upper bound (already resolved to a UTC instant). */
  endDate?: Date;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface UpdateStatusData {
  status: InteractionStatus;
  closedAt?: Date;
}

function buildWhereClause(filters: InteractionFilters): Prisma.InteractionWhereInput {
  const where: Prisma.InteractionWhereInput = {};

  if (filters.agentId) where.agentId = filters.agentId;
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;

  if (filters.startDate || filters.endDate) {
    where.openedAt = {
      ...(filters.startDate ? { gte: filters.startDate } : {}),
      ...(filters.endDate ? { lt: filters.endDate } : {}),
    };
  }

  return where;
}

export async function create(data: CreateInteractionData) {
  return prisma.interaction.create({
    data: {
      agentId: data.agentId,
      type: data.type,
      ...(data.openedAt ? { openedAt: data.openedAt } : {}),
    },
  });
}

export async function findById(id: string) {
  return prisma.interaction.findUnique({ where: { id } });
}

export async function findMany(filters: InteractionFilters, pagination: Pagination) {
  const where = buildWhereClause(filters);
  const { page, pageSize } = pagination;

  return prisma.interaction.findMany({
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { openedAt: 'desc' },
    include: {
      agent: {
        select: { name: true },
      },
    },
  });
}

export async function count(filters: InteractionFilters) {
  const where = buildWhereClause(filters);
  return prisma.interaction.count({ where });
}

export async function updateStatus(id: string, data: UpdateStatusData) {
  return prisma.interaction.update({
    where: { id },
    data: {
      status: data.status,
      ...(data.closedAt !== undefined ? { closedAt: data.closedAt } : {}),
    },
  });
}