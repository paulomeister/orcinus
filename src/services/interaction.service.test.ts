import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as interactionRepository from '../repositories/interaction.repository.js';
import * as agentRepository from '../repositories/agent.repository.js';
import {
  createInteraction,
  updateInteractionStatus,
  listInteractions,
} from './interaction.service.js';
import { InteractionStatus, InteractionType } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../errors/AppError.js';

vi.mock('../repositories/interaction.repository');
vi.mock('../repositories/agent.repository');

const mockAgentRepository = agentRepository as any;
const mockInteractionRepository = interactionRepository as any;

describe('interaction.service', () => {
  describe('createInteraction', () => {
    const mockDto = {
      agentId: 'agent-uuid',
      type: InteractionType.LLAMADA,
      openedAt: new Date(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('throws BadRequestError when agent does not exist', async () => {
      mockAgentRepository.findById.mockResolvedValue(null);

      await expect(createInteraction(mockDto)).rejects.toThrow(BadRequestError);
      expect(mockAgentRepository.findById).toHaveBeenCalledWith(mockDto.agentId);
    });

    it('calls repository.create with correct payload when agent exists', async () => {
      mockAgentRepository.findById.mockResolvedValue({ id: 'agent-uuid' });
      mockInteractionRepository.create.mockResolvedValue({ id: 'interaction-uuid', ...mockDto });

      const result = await createInteraction(mockDto);

      expect(result).toEqual({ id: 'interaction-uuid', ...mockDto });
      expect(mockInteractionRepository.create).toHaveBeenCalledWith(mockDto);
    });

    it('creates interaction without openedAt when not provided', async () => {
      const dtoWithoutOpenedAt = {
        agentId: 'agent-uuid',
        type: InteractionType.TICKET,
      };

      mockAgentRepository.findById.mockResolvedValue({ id: 'agent-uuid' });
      mockInteractionRepository.create.mockResolvedValue({
        id: 'interaction-uuid',
        ...dtoWithoutOpenedAt,
      });

      const result = await createInteraction(dtoWithoutOpenedAt);

      expect(mockInteractionRepository.create).toHaveBeenCalledWith(dtoWithoutOpenedAt);
      expect(result).toEqual({ id: 'interaction-uuid', ...dtoWithoutOpenedAt });
    });
  });

  describe('updateInteractionStatus', () => {
    const mockInteraction = {
      id: 'interaction-uuid',
      status: InteractionStatus.ABIERTA,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('throws NotFoundError when interaction does not exist', async () => {
      mockInteractionRepository.findById.mockResolvedValue(null);

      await expect(
        updateInteractionStatus('non-existent-id', InteractionStatus.EN_PROGRESO)
      ).rejects.toThrow(NotFoundError);
      expect(mockInteractionRepository.findById).toHaveBeenCalledWith('non-existent-id');
    });

    it('throws BadRequestError when transition is not allowed', async () => {
      // Trying to go from ABIERTA directly to RESUELTA (invalid)
      mockInteractionRepository.findById.mockResolvedValue(mockInteraction);

      await expect(
        updateInteractionStatus('interaction-uuid', InteractionStatus.RESUELTA)
      ).rejects.toThrow(BadRequestError);
      expect(mockInteractionRepository.findById).toHaveBeenCalledWith('interaction-uuid');
    });

    it('allows valid transition: ABIERTA → EN_PROGRESO', async () => {
      mockInteractionRepository.findById.mockResolvedValue(mockInteraction);
      mockInteractionRepository.updateStatus.mockResolvedValue({
        ...mockInteraction,
        status: InteractionStatus.EN_PROGRESO,
      });

      const result = await updateInteractionStatus('interaction-uuid', InteractionStatus.EN_PROGRESO);

      expect(result.status).toBe(InteractionStatus.EN_PROGRESO);
      expect(mockInteractionRepository.updateStatus).toHaveBeenCalledWith(
        'interaction-uuid',
        { status: InteractionStatus.EN_PROGRESO, closedAt: undefined }
      );
    });

    it('allows valid transition: EN_PROGRESO → RESUELTA and sets closedAt', async () => {
      const expectedClosedAt = new Date();
      mockInteractionRepository.findById.mockResolvedValue({
        ...mockInteraction,
        status: InteractionStatus.EN_PROGRESO,
      });
      mockInteractionRepository.updateStatus.mockResolvedValue({
        id: 'interaction-uuid',
        status: InteractionStatus.RESUELTA,
        closedAt: expectedClosedAt,
      });

      const result = await updateInteractionStatus('interaction-uuid', InteractionStatus.RESUELTA);

      expect(result.status).toBe(InteractionStatus.RESUELTA);
      expect(result.closedAt).toBe(expectedClosedAt);
    });

    it('throws BadRequestError when transitioning from RESUELTA (no further transitions)', async () => {
      mockInteractionRepository.findById.mockResolvedValue({
        ...mockInteraction,
        status: InteractionStatus.RESUELTA,
      });

      await expect(
        updateInteractionStatus('interaction-uuid', InteractionStatus.ABIERTA)
      ).rejects.toThrow(BadRequestError);
      expect(mockInteractionRepository.findById).toHaveBeenCalledWith('interaction-uuid');
    });
  });

  describe('listInteractions', () => {
    const mockPagination = { page: 1, pageSize: 10 };

    beforeEach(() => {
      vi.clearAllMocks();
      mockInteractionRepository.findMany.mockResolvedValue([]);
      mockInteractionRepository.count.mockResolvedValue(0);
    });

    it('throws BadRequestError when startDate > endDate', async () => {
      await expect(
        listInteractions(
          { startDate: '2026-01-15', endDate: '2026-01-10' },
          mockPagination
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('filters by date range and calls repository methods', async () => {
      const filters = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };

      mockInteractionRepository.findMany.mockResolvedValue([
        { id: '1', status: InteractionStatus.ABIERTA },
        { id: '2', status: InteractionStatus.EN_PROGRESO },
      ]);
      mockInteractionRepository.count.mockResolvedValue(2);

      const result = await listInteractions(filters, mockPagination);

      expect(mockInteractionRepository.findMany).toHaveBeenCalled();
      expect(mockInteractionRepository.count).toHaveBeenCalled();
      expect(result.total).toBe(2);
      expect(result.data.length).toBe(2);
    });

    it('returns empty data with total 0 when no results match', async () => {
      mockInteractionRepository.findMany.mockResolvedValue([]);
      mockInteractionRepository.count.mockResolvedValue(0);

      const result = await listInteractions({}, mockPagination);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('computes totalPages correctly', async () => {
      mockInteractionRepository.findMany.mockResolvedValue([]);
      mockInteractionRepository.count.mockResolvedValue(25);

      const result1 = await listInteractions({}, { page: 1, pageSize: 10 });
      expect(result1.totalPages).toBe(3);

      const result2 = await listInteractions({}, { page: 2, pageSize: 10 });
      expect(result2.totalPages).toBe(3);

      const result3 = await listInteractions({}, { page: 3, pageSize: 10 });
      expect(result3.totalPages).toBe(3);
    });

    it('uses agentId, status, and type filters correctly', async () => {
      const filters = {
        agentId: 'agent-uuid',
        status: InteractionStatus.ABIERTA,
        type: InteractionType.LLAMADA,
      };

      await listInteractions(filters, mockPagination);

      const call = mockInteractionRepository.findMany.mock.calls[0];
      expect(call[0]).toMatchObject({
        agentId: 'agent-uuid',
        status: InteractionStatus.ABIERTA,
        type: InteractionType.LLAMADA,
      });
    });
  });
});
