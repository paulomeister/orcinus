import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { create, updateStatus, list } from './interaction.controller';
import * as interactionService from '../services/interaction.service';
import { serializeInteraction } from '../utils/enumMappers';
import { InteractionStatus, InteractionType } from '@prisma/client';

vi.mock('../services/interaction.service');

describe('interaction.controller', () => {
  const mockNext = vi.fn() as unknown as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    const validBody = {
      agentId: 'agent-uuid',
      type: 'llamada',
      openedAt: '2026-01-15T10:30:00Z',
    };

    it('calls service.createInteraction with parsed body and returns 201', async () => {
      const mockInteraction = {
        id: 'interaction-uuid',
        agentId: 'agent-uuid',
        type: InteractionType.LLAMADA,
        status: InteractionStatus.ABIERTA,
        openedAt: new Date('2026-01-15T10:30:00Z'),
        closedAt: null,
      };

      (interactionService.createInteraction as Mock).mockResolvedValue(mockInteraction);

      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await create({ body: validBody } as unknown as Request, mockResponse as unknown as Response, mockNext);

      expect(interactionService.createInteraction).toHaveBeenCalledWith({
        agentId: 'agent-uuid',
        type: InteractionType.LLAMADA,
        openedAt: expect.any(Date),
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(serializeInteraction(mockInteraction));
    });

    it('returns 400 on validation failure (missing required fields)', async () => {
      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Missing agentId and type
      await create({ body: {} } as unknown as Request, mockResponse as unknown as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const err = (mockNext as Mock).mock.calls[0][0];
      expect(err.statusCode).toBe(400);
    });

    it('returns 400 when service throws BadRequestError', async () => {
      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      (interactionService.createInteraction as Mock).mockRejectedValue(
        new Error('Agent does not exist')
      );

      await create({ body: validBody } as unknown as Request, mockResponse as unknown as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    const validParams = { id: 'interaction-uuid' };
    const validBody = { status: 'en_progreso' };

    it('calls service.updateInteractionStatus and returns 200', async () => {
      const mockInteraction = {
        id: 'interaction-uuid',
        type: InteractionType.LLAMADA,
        status: InteractionStatus.EN_PROGRESO,
      };

      (interactionService.updateInteractionStatus as Mock).mockResolvedValue(mockInteraction);

      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await updateStatus(
        { params: validParams, body: validBody } as unknown as Request,
        mockResponse as unknown as Response,
        mockNext
      );

      expect(interactionService.updateInteractionStatus).toHaveBeenCalledWith(
        'interaction-uuid',
        InteractionStatus.EN_PROGRESO
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(serializeInteraction(mockInteraction));
    });

    it('returns 400 on validation failure (invalid status)', async () => {
      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Invalid status value
      await updateStatus(
        { params: validParams, body: { status: 'invalid' } } as unknown as Request,
        mockResponse as unknown as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const err = (mockNext as Mock).mock.calls[0][0];
      expect(err.statusCode).toBe(400);
    });

    it('returns 400 when service throws BadRequestError (invalid transition)', async () => {
      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      (interactionService.updateInteractionStatus as Mock).mockRejectedValue(
        new Error('Invalid status transition')
      );

      await updateStatus(
        { params: validParams, body: validBody } as unknown as Request,
        mockResponse as unknown as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('returns 404 when service throws NotFoundError', async () => {
      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      (interactionService.updateInteractionStatus as Mock).mockRejectedValue(
        new Error('Interaction not found')
      );

      await updateStatus(
        { params: validParams, body: validBody } as unknown as Request,
        mockResponse as unknown as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    const validQuery = {
      page: '1',
      pageSize: '10',
    };

    it('calls service.listInteractions and returns 200 with paginated response', async () => {
      const mockResult = {
        data: [
          {
            id: '1',
            type: InteractionType.LLAMADA,
            status: InteractionStatus.ABIERTA,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      (interactionService.listInteractions as Mock).mockResolvedValue(mockResult);

      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await list({ query: validQuery } as unknown as Request, mockResponse as unknown as Response, mockNext);

      expect(interactionService.listInteractions).toHaveBeenCalledWith({}, { page: 1, pageSize: 10 });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        ...mockResult,
        data: mockResult.data.map(serializeInteraction),
      });
    });

    it('handles empty results correctly', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };

      (interactionService.listInteractions as Mock).mockResolvedValue(mockResult);

      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await list({ query: validQuery } as unknown as Request, mockResponse as unknown as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        ...mockResult,
        data: [],
      });
    });

    it('returns 400 on validation failure (invalid pagination)', async () => {
      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Invalid page value
      await list({ query: { ...validQuery, page: 'invalid' } as any } as unknown as Request, mockResponse as unknown as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const err = (mockNext as Mock).mock.calls[0][0];
      expect(err.statusCode).toBe(400);
    });

    it('uses default pagination values when not provided', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };

      (interactionService.listInteractions as Mock).mockResolvedValue(mockResult);

      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await list({ query: {} as any } as unknown as Request, mockResponse as unknown as Response, mockNext);

      expect(interactionService.listInteractions).toHaveBeenCalledWith({}, { page: 1, pageSize: 10 });
    });

    it('transforms date range filters correctly', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };

      (interactionService.listInteractions as Mock).mockResolvedValue(mockResult);

      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await list(
        { query: { ...validQuery, startDate: '2026-01-01', endDate: '2026-01-31' } as any } as unknown as Request,
        mockResponse as unknown as Response,
        mockNext
      );

      expect(interactionService.listInteractions).toHaveBeenCalledWith(
        {
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        },
        { page: 1, pageSize: 10 }
      );
    });
  });
});
