import { z } from 'zod';
import { API_STATUS_TO_PRISMA, API_TYPE_TO_PRISMA } from '../utils/enumMappers';

export const createInteractionSchema = z.object({
  agentId: z.string().uuid({ message: 'agentId must be a valid UUID' }),
  type: z
    .enum(['llamada', 'ticket'], { message: 'type must be one of: llamada, ticket' })
    .transform((val) => API_TYPE_TO_PRISMA[val]),
  openedAt: z
    .string()
    .datetime({ offset: true, message: 'openedAt must be a valid ISO-8601 datetime' })
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export const updateStatusParamsSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});

export const updateStatusSchema = z.object({
  status: z
    .enum(['en_progreso', 'resuelta'], { message: 'status must be one of: en_progreso, resuelta' })
    .transform((val) => API_STATUS_TO_PRISMA[val]),
});

export const listInteractionsSchema = z.object({
  agentId: z.string().uuid({ message: 'agentId must be a valid UUID' }).optional(),
  status: z
    .enum(['abierta', 'en_progreso', 'resuelta'], { message: 'status must be one of: abierta, en_progreso, resuelta' })
    .optional()
    .transform((val) => (val ? API_STATUS_TO_PRISMA[val] : undefined)),
  type: z
    .enum(['llamada', 'ticket'], { message: 'type must be one of: llamada, ticket' })
    .optional()
    .transform((val) => (val ? API_TYPE_TO_PRISMA[val] : undefined)),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be in YYYY-MM-DD format')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be in YYYY-MM-DD format')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type ListInteractionsQuery = z.infer<typeof listInteractionsSchema>;


