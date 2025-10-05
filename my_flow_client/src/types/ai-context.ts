import type { ContextType } from './context';

/**
 * AI Context Suggestion
 * Returned by AI when it detects user input belongs to a different context
 */
export interface AIContextSuggestion {
  suggestedContext: ContextType;
  confidence: number; // 0-1 scale
  reason?: string; // Optional explanation for the suggestion
}

/**
 * Context Switch Trigger
 * Determines how aggressively to auto-switch contexts based on AI suggestions
 */
export type ContextSwitchMode = 'manual' | 'suggest' | 'auto';

/**
 * Configuration for context switching behavior
 */
export interface ContextSwitchConfig {
  mode: ContextSwitchMode;
  suggestThreshold?: number; // Default: 0.8
  autoThreshold?: number; // Default: 0.6
}
