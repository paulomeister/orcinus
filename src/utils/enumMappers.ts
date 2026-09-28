import { InteractionStatus, InteractionType } from '@prisma/client';

export const API_TYPE_TO_PRISMA: Record<'llamada' | 'ticket', InteractionType> = {
  llamada: InteractionType.LLAMADA,
  ticket: InteractionType.TICKET,
};

export const PRISMA_TYPE_TO_API: Record<InteractionType, string> = {
  [InteractionType.LLAMADA]: 'llamada',
  [InteractionType.TICKET]: 'ticket',
};

export const API_STATUS_TO_PRISMA: Record<
  'abierta' | 'en_progreso' | 'resuelta',
  InteractionStatus
> = {
  abierta: InteractionStatus.ABIERTA,
  en_progreso: InteractionStatus.EN_PROGRESO,
  resuelta: InteractionStatus.RESUELTA,
};

export const PRISMA_STATUS_TO_API: Record<InteractionStatus, string> = {
  [InteractionStatus.ABIERTA]: 'abierta',
  [InteractionStatus.EN_PROGRESO]: 'en_progreso',
  [InteractionStatus.RESUELTA]: 'resuelta',
};

/**
 * Converts a Prisma Interaction record (and its optional joined `agent`)
 * into the API's lowercase wire format for type/status.
 */
export function serializeInteraction<
  T extends { type: InteractionType; status: InteractionStatus },
>(interaction: T) {
  return {
    ...interaction,
    type: PRISMA_TYPE_TO_API[interaction.type],
    status: PRISMA_STATUS_TO_API[interaction.status],
  };
}