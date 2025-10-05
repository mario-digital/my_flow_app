import {
  setContextTheme,
  showContextSwitchNotification,
} from './context-theme';
import type { ContextType } from '@/types/context';
import type {
  AIContextSuggestion,
  ContextSwitchConfig,
} from '@/types/ai-context';

/**
 * Handles AI-triggered context switches based on user preferences
 *
 * @param suggestion - AI context suggestion from chat response
 * @param config - Context switch configuration including mode and thresholds
 * @param currentContext - Current active context
 * @returns Whether to proceed with context switch
 *
 * @example
 * // Manual mode - never auto-switch
 * const suggestion = { suggestedContext: 'work', confidence: 0.95 };
 * const config = { mode: 'manual' };
 * const switched = handleAIContextSuggestion(suggestion, config, 'personal');
 * // Returns: false (never switches in manual mode)
 *
 * @example
 * // Suggest mode - auto-switch only if high confidence
 * const suggestion = { suggestedContext: 'work', confidence: 0.85 };
 * const config = { mode: 'suggest', suggestThreshold: 0.8 };
 * const switched = handleAIContextSuggestion(suggestion, config, 'personal');
 * // Returns: true (confidence 0.85 > threshold 0.8)
 *
 * @example
 * // Auto mode - auto-switch for medium-high confidence
 * const suggestion = { suggestedContext: 'rest', confidence: 0.7 };
 * const config = { mode: 'auto', autoThreshold: 0.6 };
 * const switched = handleAIContextSuggestion(suggestion, config, 'work');
 * // Returns: true (confidence 0.7 > threshold 0.6)
 *
 * @example
 * // Already in suggested context - no switch
 * const suggestion = { suggestedContext: 'work', confidence: 0.95 };
 * const config = { mode: 'auto' };
 * const switched = handleAIContextSuggestion(suggestion, config, 'work');
 * // Returns: false (already in work context)
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
        showContextSwitchNotification(suggestion.suggestedContext);
        return true;
      }
      return false;

    case 'auto':
      // Auto-switch for medium-high confidence (>threshold)
      if (suggestion.confidence > autoThreshold) {
        setContextTheme(suggestion.suggestedContext);
        showContextSwitchNotification(suggestion.suggestedContext);
        return true;
      }
      return false;

    default:
      return false;
  }
}
