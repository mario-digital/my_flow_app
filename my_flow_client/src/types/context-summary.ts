import type { components } from './api';

/**
 * Flow type from API schema.
 */
export type Flow = components['schemas']['FlowInDB'];

/**
 * Context type from API schema.
 */
export type Context = components['schemas']['ContextInDB'];

/**
 * AI-generated summary of a context's status and progress.
 * Provides an overview for dashboard display.
 */
export interface ContextSummary {
  /** Context identifier (MongoDB ObjectId) */
  context_id: string;

  /** Count of incomplete flows in this context */
  incomplete_flows_count: number;

  /** Count of completed flows in this context */
  completed_flows_count: number;

  /** AI-generated natural language summary */
  summary_text: string;

  /** Most recent activity timestamp (ISO 8601) */
  last_activity: string | null;

  /** Top 3 high-priority incomplete flows */
  top_priorities: Flow[];
}

/**
 * Combined data for dashboard display.
 * Pairs context metadata with its summary.
 */
export interface ContextWithSummary {
  context_id: string;
  context_name: string;
  context_icon: string;
  context_color: string;
  summary: ContextSummary;
}
