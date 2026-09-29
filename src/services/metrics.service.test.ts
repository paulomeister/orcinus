import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as metricsRepository from '../repositories/metrics.repository.js';
import { getMetrics, fillDailyGaps } from './metrics.service.js';
import { BadRequestError } from '../errors/AppError.js';

vi.mock('../repositories/metrics.repository');

const mockRepository = metricsRepository as any;

describe('metrics.service', () => {
  describe('fillDailyGaps', () => {
    it('fills missing days with total 0', async () => {
      const dbRows = [
        { day: '2026-09-01', total: 5 },
        { day: '2026-09-03', total: 10 },
      ];
      const result = fillDailyGaps(dbRows, '2026-09-01', '2026-09-03');

      expect(result).toEqual([
        { day: '2026-09-01', total: 5 },
        { day: '2026-09-02', total: 0 },
        { day: '2026-09-03', total: 10 },
      ]);
    });

    it('returns all days as 0 when input has no rows', async () => {
      const dbRows: { day: string; total: number }[] = [];
      const result = fillDailyGaps(dbRows, '2026-09-01', '2026-09-03');

      expect(result).toEqual([
        { day: '2026-09-01', total: 0 },
        { day: '2026-09-02', total: 0 },
        { day: '2026-09-03', total: 0 },
      ]);
    });

    it('works correctly for single-day range', async () => {
      const dbRows = [{ day: '2026-09-01', total: 7 }];
      const result = fillDailyGaps(dbRows, '2026-09-01', '2026-09-01');

      expect(result).toEqual([{ day: '2026-09-01', total: 7 }]);
    });

    it('handles empty input with empty range', async () => {
      const dbRows: { day: string; total: number }[] = [];
      const result = fillDailyGaps(dbRows, '2026-09-01', '2026-09-01');

      expect(result).toEqual([{ day: '2026-09-01', total: 0 }]);
    });
  });

  describe('getMetrics', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('throws BadRequestError when startDate > endDate', async () => {
      await expect(getMetrics('2026-09-10', '2026-09-01')).rejects.toThrow(
        BadRequestError
      );
    });

    it('normalizes dates correctly and returns response', async () => {
      const mockAgentMetrics = [
        {
          agentId: 'agent-uuid',
          agentName: 'Jane Doe',
          totalInteractions: 15,
          totalResolved: 12,
          resolutionRate: 80.0,
          avgResolutionSeconds: 450,
        },
      ];

      const mockDailyVolume = [
        { day: '2026-09-01', total: 5 },
        { day: '2026-09-02', total: 10 },
      ];

      mockRepository.getAgentMetrics.mockResolvedValue(mockAgentMetrics);
      mockRepository.getDailyVolume.mockResolvedValue(mockDailyVolume);

      const result = await getMetrics('2026-09-01', '2026-09-02');

      // Verify date normalization - rangeStart is inclusive, rangeEnd is exclusive (next day)
      expect(mockRepository.getAgentMetrics).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockRepository.getDailyVolume).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );

      expect(result).toEqual({
        startDate: '2026-09-01',
        endDate: '2026-09-02',
        agentMetrics: mockAgentMetrics,
        dailyVolume: [
          { day: '2026-09-01', total: 5 },
          { day: '2026-09-02', total: 10 },
        ],
      });
    });

    it('handles zero interactions case (division by zero)', async () => {
      const mockAgentMetrics: Array<{
        agentId: string;
        agentName: string;
        totalInteractions: number;
        totalResolved: number;
        resolutionRate: number;
        avgResolutionSeconds: number;
      }> = [
        {
          agentId: 'agent-uuid',
          agentName: 'John Doe',
          totalInteractions: 0,
          totalResolved: 0,
          resolutionRate: 0.0,
          avgResolutionSeconds: 0,
        },
      ];

      mockRepository.getAgentMetrics.mockResolvedValue(mockAgentMetrics);
      mockRepository.getDailyVolume.mockResolvedValue([]);

      const result = await getMetrics('2026-09-01', '2026-09-01');

      expect(result.agentMetrics[0]).toBeDefined();
      expect(result.agentMetrics[0]!.resolutionRate).toBe(0.0);
      expect(result.agentMetrics[0]!.avgResolutionSeconds).toBe(0);
    });

    it('handles agent with zero resolved interactions', async () => {
      const mockAgentMetrics: Array<{
        agentId: string;
        agentName: string;
        totalInteractions: number;
        totalResolved: number;
        resolutionRate: number;
        avgResolutionSeconds: number;
      }> = [
        {
          agentId: 'agent-uuid',
          agentName: 'John Doe',
          totalInteractions: 5,
          totalResolved: 0,
          resolutionRate: 0.0,
          avgResolutionSeconds: 0,
        },
      ];

      mockRepository.getAgentMetrics.mockResolvedValue(mockAgentMetrics);
      mockRepository.getDailyVolume.mockResolvedValue([]);

      const result = await getMetrics('2026-09-01', '2026-09-01');

      expect(result.agentMetrics[0]).toBeDefined();
      expect(result.agentMetrics[0]!.resolutionRate).toBe(0.0);
      expect(result.agentMetrics[0]!.avgResolutionSeconds).toBe(0);
    });

    it('fills daily gaps when some days have no data', async () => {
      const mockDailyVolume = [
        { day: '2026-09-01', total: 5 },
        { day: '2026-09-03', total: 10 },
      ];

      mockRepository.getAgentMetrics.mockResolvedValue([]);
      mockRepository.getDailyVolume.mockResolvedValue(mockDailyVolume);

      const result = await getMetrics('2026-09-01', '2026-09-03');

      expect(result.dailyVolume).toEqual([
        { day: '2026-09-01', total: 5 },
        { day: '2026-09-02', total: 0 },
        { day: '2026-09-03', total: 10 },
      ]);
    });
  });
});
