import prisma from '../lib/prisma.js';

export interface AgentMetricsRow {
  agentId: string;
  agentName: string;
  totalInteractions: number;
  totalResolved: number;
  resolutionRate: number;
  avgResolutionSeconds: number;
}

export interface DailyVolumeRow {
  day: string;
  total: number;
}

export async function getAgentMetrics(rangeStart: Date, rangeEnd: Date): Promise<AgentMetricsRow[]> {
  const results = await prisma.$queryRaw<AgentMetricsRow[]>`
    SELECT
      a.id AS "agentId",
      a.name AS "agentName",
      COUNT(i.id)::int AS "totalInteractions",
      COUNT(i.id) FILTER (WHERE i.status = 'resuelta')::int AS "totalResolved",
      COALESCE(
        ROUND(
          COUNT(i.id) FILTER (WHERE i.status = 'resuelta')::numeric
          / NULLIF(COUNT(i.id), 0) * 100,
          1
        ),
        0
      )::float AS "resolutionRate",
      COALESCE(
        AVG(
          EXTRACT(EPOCH FROM (i.closed_at - i.opened_at))
        ) FILTER (WHERE i.status = 'resuelta'),
        0
      )::int AS "avgResolutionSeconds"
    FROM agents a
    JOIN interactions i ON i.agent_id = a.id
    WHERE i.opened_at >= ${rangeStart}
      AND i.opened_at < ${rangeEnd}
    GROUP BY a.id, a.name
    ORDER BY a.name;
  `;

  return results;
}

export async function getDailyVolume(rangeStart: Date, rangeEnd: Date): Promise<DailyVolumeRow[]> {
  const results = await prisma.$queryRaw<DailyVolumeRow[]>`
    SELECT
      TO_CHAR(
        i.opened_at AT TIME ZONE 'America/Bogota',
        'YYYY-MM-DD'
      ) AS "day",
      COUNT(i.id)::int AS "total"
    FROM interactions i
    WHERE i.opened_at >= ${rangeStart}
      AND i.opened_at < ${rangeEnd}
    GROUP BY "day"
    ORDER BY "day";
  `;

  return results;
}