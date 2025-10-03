import { setContextTheme, type ContextType } from './context-theme';
import type {
  AIContextSuggestion,
  ContextSwitchMode,
} from '@/types/ai-context';

/**
 * Handles AI-triggered context switches based on user preferences
 * @param suggestion - AI context suggestion from chat response
 * @param mode - Context switch mode (manual/suggest/auto)
 * @param currentContext - Current active context
 * @returns Whether to proceed with context switch
 */
export function handleAIContextSuggestion(
  suggestion: AIContextSuggestion,
  mode: ContextSwitchMode,
  currentContext: ContextType
): boolean {
  // Don't switch if already in suggested context
  if (suggestion.suggestedContext === currentContext) {
    return false;
  }

  switch (mode) {
    case 'manual':
      // Never auto-switch, only show suggestion to user
      return false;

    case 'suggest':
      // Auto-switch only if high confidence (>80%)
      if (suggestion.confidence > 0.8) {
        setContextTheme(suggestion.suggestedContext);
        return true;
      }
      return false;

    case 'auto':
      // Auto-switch for medium-high confidence (>60%)
      if (suggestion.confidence > 0.6) {
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
 */
export function showContextSwitchNotification(
  fromContext: ContextType,
  toContext: ContextType,
  reason?: string
): void {
  // Implementation: Show toast/notification
  // Example: "Switched to Work context - detected work-related task"
  console.log(`Context switched: ${fromContext} → ${toContext}`, reason);
}
