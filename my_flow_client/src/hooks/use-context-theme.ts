import { useEffect } from 'react';
import { setContextTheme, type ContextType } from '@/lib/context-theme';

/**
 * Hook to manage context-based theming
 * @param context - The current context
 */
export function useContextTheme(context: ContextType): void {
  useEffect(() => {
    setContextTheme(context);
  }, [context]);
}
