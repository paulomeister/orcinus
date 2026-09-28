import { InteractionStatus, InteractionType } from '@prisma/client';
import * as interactionRepository from '../repositories/interaction.repository';
import * as agentRepository from '../repositories/agent.repository';
import { BadRequestError, NotFoundError } from '../errors/AppError';

const ALLOWED_TRANSITIONS: Record<InteractionStatus, InteractionStatus | null> = {
  [InteractionStatus.ABIERTA]: InteractionStatus.EN_PROGRESO,
  [InteractionStatus.EN_PROGRESO]: InteractionStatus.RESUELTA,
  [InteractionStatus.RESUELTA]: null,
};

const BOGOTA_OFFSET = '-05:00';

function toBogotaStartOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00${BOGOTA_OFFSET}`);
}

function toBogotaExclusiveUpperBound(dateStr: string): Date {
  const date = toBogotaStartOfDay(dateStr);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

export interface CreateInteractionDto {
  agentId: string;
  type: InteractionType;
  openedAt?: Date;
}

export async function createInteraction(dto: CreateInteractionDto) {
  const agent = await agentRepository.findById(dto.agentId);
  if (!agent) {
    throw new BadRequestError(`Agent with id ${dto.agentId} does not exist`);
  }

  return interactionRepository.create(dto);
}

export async function updateInteractionStatus(id: string, newStatus: InteractionStatus) {
  const interaction = await interactionRepository.findById(id);
  if (!interaction) {
    throw new NotFoundError(`Interaction with id ${id} not found`);
  }

  const allowedNext = ALLOWED_TRANSITIONS[interaction.status];
  if (allowedNext !== newStatus) {
    throw new BadRequestError(
      `Invalid status transition: ${interaction.status} → ${newStatus}. ` +
        `Allowed next status: ${allowedNext ?? 'none'}`
    );
  }

  const closedAt = newStatus === InteractionStatus.RESUELTA ? new Date() : undefined;

  return interactionRepository.updateStatus(id, { status: newStatus, closedAt });
}

export interface ListInteractionsFilters {
  agentId?: string;
  status?: InteractionStatus;
  type?: InteractionType;
  /** Raw YYYY-MM-DD as received from the client. */
  startDate?: string;
  /** Raw YYYY-MM-DD as received from the client. */
  endDate?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export async function listInteractions(
  filters: ListInteractionsFilters,
  pagination: Pagination
) {
  // Lexicographic comparison is valid here because both are fixed-width
  // YYYY-MM-DD strings, which sort identically to chronological order.
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    throw new BadRequestError('startDate must not be greater than endDate');
  }

  const repositoryFilters = {
    agentId: filters.agentId,
    status: filters.status,
    type: filters.type,
    startDate: filters.startDate ? toBogotaStartOfDay(filters.startDate) : undefined,
    endDate: filters.endDate ? toBogotaExclusiveUpperBound(filters.endDate) : undefined,
  };

  const [data, total] = await Promise.all([
    interactionRepository.findMany(repositoryFilters, pagination),
    interactionRepository.count(repositoryFilters),
  ]);

  const totalPages = pagination.pageSize > 0 ? Math.ceil(total / pagination.pageSize) : 0;

  return {
    data,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
  };
}