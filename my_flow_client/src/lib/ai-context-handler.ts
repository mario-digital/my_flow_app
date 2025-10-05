import { setContextTheme, type ContextType } from './context-theme';
import type {
  AIContextSuggestion,
  ContextSwitchMode,
} from '@/types/ai-context';

/**
 * Configuration for context switching behavior
 */
export interface ContextSwitchConfig {
  mode: ContextSwitchMode;
  suggestThreshold?: number; // Default: 0.8
  autoThreshold?: number; // Default: 0.6
}

/**
 * Handles AI-triggered context switches based on user preferences
 * @param suggestion - AI context suggestion from chat response
 * @param config - Context switch configuration including mode and thresholds
 * @param currentContext - Current active context
 * @returns Whether to proceed with context switch
 */
export function handleAIContextSuggestion(
  suggestion: AIContextSuggestion,
  config: ContextSwitchConfig,
  currentContext: ContextType
): boolean {
  const { mode, suggestThreshold = 0.8, autoThreshold = 0.6 } = config;

  // Don't switch if already in suggested context
  if (suggestion.suggestedContext === currentContext) {
    return false;
  }

  switch (mode) {
    case 'manual':
      // Never auto-switch, only show suggestion to user
      return false;

    case 'suggest':
      // Auto-switch only if high confidence (>threshold)
      if (suggestion.confidence > suggestThreshold) {
        setContextTheme(suggestion.suggestedContext);
        return true;
      }
      return false;

    case 'auto':
      // Auto-switch for medium-high confidence (>threshold)
      if (suggestion.confidence > autoThreshold) {
        setContextTheme(suggestion.suggestedContext);
        return true;
      }
      return false;

    default:
      return false;
  }
}

/**
 * Display AI context switch notification
 * Show user-friendly message when AI switches context
 *
 * TODO: Integrate with a toast library (e.g., sonner, react-hot-toast)
 * Example implementation:
 * toast.info(`Switched to ${toContext} context`, {
 *   description: reason || `Detected ${toContext}-related activity`,
 *   duration: 3000,
 * });
 */
export function showContextSwitchNotification(
  fromContext: ContextType,
  toContext: ContextType,
  reason?: string
): void {
  // PLACEHOLDER: Console log until toast library is integrated
  console.log(`Context switched: ${fromContext} → ${toContext}`, reason);
}
