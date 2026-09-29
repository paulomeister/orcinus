import { BadRequestError } from '../errors/AppError.js';
import { getAgentMetrics, getDailyVolume } from '../repositories/metrics.repository.js';

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalInteractions: number;
  totalResolved: number;
  resolutionRate: number;
  avgResolutionSeconds: number;
}

export interface DailyVolume {
  day: string;
  total: number;
}

export interface MetricsResponse {
  startDate: string;
  endDate: string;
  agentMetrics: AgentMetrics[];
  dailyVolume: DailyVolume[];
}

export function fillDailyGaps(
  dbRows: DailyVolume[],
  startDate: string,
  endDate: string
): DailyVolume[] {
  const rowMap = new Map(dbRows.map((r) => [r.day, r.total]));
  const result: DailyVolume[] = [];

  // Explicitly parse as UTC midnight to align with toISOString()
  const current = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (current <= end) {
    const dayStr = current.toISOString().slice(0, 10);
    result.push({ day: dayStr, total: rowMap.get(dayStr) ?? 0 });

    // Mutate strictly via UTC methods to avoid local server timezone drift
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
}

export async function getMetrics(startDate: string, endDate: string): Promise<MetricsResponse> {
  // Validate startDate <= endDate
  if (startDate > endDate) {
    throw new BadRequestError('startDate cannot be greater than endDate');
  }

  // Normalize dates to Colombia timezone boundaries
  // rangeStart = startDate + T00:00:00-05:00 (inclusive)
  // rangeEnd = (endDate + 1 day) + T00:00:00-05:00 (exclusive)
  const rangeStart = new Date(`${startDate}T00:00:00.000-05:00`);
  const rangeEnd = new Date(`${endDate}T00:00:00.000-05:00`);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);

  // Get data from repository
  const [agentMetrics, dailyVolume] = await Promise.all([
    getAgentMetrics(rangeStart, rangeEnd),
    getDailyVolume(rangeStart, rangeEnd),
  ]);

  // Fill daily gaps
  const filledDailyVolume = fillDailyGaps(dailyVolume, startDate, endDate);

  return {
    startDate,
    endDate,
    agentMetrics,
    dailyVolume: filledDailyVolume,
  };
}
