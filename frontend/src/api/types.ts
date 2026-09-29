// Mirrors the wire format produced by src/utils/enumMappers.ts (serializeInteraction)
// and the response shapes documented in each module's design.md.

export type InteractionType = 'llamada' | 'ticket';
export type InteractionStatus = 'abierta' | 'en_progreso' | 'resuelta';

export interface Agent {
  id: string;
  name: string;
  email: string;
}

export interface Interaction {
  id: string;
  agentId: string;
  type: InteractionType;
  status: InteractionStatus;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  // Joined relation from interaction.repository.ts findMany()
  agent: { name: string };
}

export interface PaginatedInteractions {
  data: Interaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InteractionFilters {
  agentId?: string;
  status?: InteractionStatus;
  type?: InteractionType;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalInteractions: number;
  totalResolved: number;
  resolutionRate: number;
  avgResolutionSeconds: number;
}

export interface DailyVolume {
  day: string; // YYYY-MM-DD
  total: number;
}

export interface MetricsResponse {
  startDate: string;
  endDate: string;
  agentMetrics: AgentMetrics[];
  dailyVolume: DailyVolume[];
}

// Matches the corrected errorHandler.ts envelope exactly.
export interface ApiErrorEnvelope {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
}
