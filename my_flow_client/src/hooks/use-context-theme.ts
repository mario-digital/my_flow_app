import { useEffect } from 'react';
import { setContextTheme } from '@/lib/context-theme';
import type { ContextType } from '@/types/context';

/**
 * Hook to manage context-based theming
 * @param context - The current context
 */
export function useContextTheme(context: ContextType): void {
  useEffect(() => {
    setContextTheme(context);
  }, [context]);
}
