import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response, NextFunction } from 'express';
import { getMetrics } from './metrics.controller';
import * as metricsService from '../services/metrics.service';
import { BadRequestError } from '../errors/AppError';

vi.mock('../services/metrics.service');

describe('metrics.controller', () => {
  const mockNext = vi.fn() as unknown as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls service.getMetrics and returns 200 with response', async () => {
    const mockResponse = {
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      agentMetrics: [],
      dailyVolume: [],
    };

    (metricsService.getMetrics as any).mockResolvedValue(mockResponse);

    const mockReq = {
      query: {
        startDate: '2026-09-01',
        endDate: '2026-09-05',
      },
    } as any;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await getMetrics(mockReq, mockRes as unknown as Response, mockNext);

    expect(metricsService.getMetrics).toHaveBeenCalledWith('2026-09-01', '2026-09-05');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it('returns 400 when startDate is missing', async () => {
    const mockReq = {
      query: {
        endDate: '2026-09-05',
      },
    } as any;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await getMetrics(mockReq, mockRes as unknown as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const err = (mockNext as any).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('returns 400 when endDate is missing', async () => {
    const mockReq = {
      query: {
        startDate: '2026-09-01',
      },
    } as any;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await getMetrics(mockReq, mockRes as unknown as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const err = (mockNext as any).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('returns 400 when startDate format is invalid', async () => {
    const mockReq = {
      query: {
        startDate: '09-01-2026',
        endDate: '2026-09-05',
      },
    } as any;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await getMetrics(mockReq, mockRes as unknown as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const err = (mockNext as any).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('returns 400 when endDate format is invalid', async () => {
    const mockReq = {
      query: {
        startDate: '2026-09-01',
        endDate: '05-09-2026',
      },
    } as any;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await getMetrics(mockReq, mockRes as unknown as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const err = (mockNext as any).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('returns 400 when service throws BadRequestError', async () => {
    const mockReq = {
      query: {
        startDate: '2026-09-10',
        endDate: '2026-09-01',
      },
    } as any;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    (metricsService.getMetrics as any).mockRejectedValue(
      new BadRequestError('startDate cannot be greater than endDate')
    );

    await getMetrics(mockReq, mockRes as unknown as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const err = (mockNext as any).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });
});
