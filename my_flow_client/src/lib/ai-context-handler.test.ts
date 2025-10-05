import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleAIContextSuggestion } from './ai-context-handler';
import {
  getCurrentContext,
  showContextSwitchNotification,
} from './context-theme';
import { toast } from 'sonner';
import type { AIContextSuggestion } from '@/types/ai-context';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('handleAIContextSuggestion', () => {
  // Mock CSS custom properties that would be defined in colors.css
  const mockCssProperties: Record<string, string> = {
    '--primitive-work': '#3B82F6',
    '--primitive-work-hover': '#60A5FA',
    '--primitive-work-active': '#93C5FD',
    '--primitive-personal': '#F97316',
    '--primitive-personal-hover': '#FB923C',
    '--primitive-personal-active': '#FDBA74',
    '--primitive-rest': '#A855F7',
    '--primitive-rest-hover': '#C084FC',
    '--primitive-rest-active': '#D8B4FE',
    '--primitive-social': '#10B981',
    '--primitive-social-hover': '#34D399',
    '--primitive-social-active': '#6EE7B7',
  };

  beforeEach(() => {
    document.documentElement.removeAttribute('data-context');
    document.documentElement.removeAttribute('style');

    // Mock getComputedStyle to return our CSS custom properties
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({
          getPropertyValue: (prop: string) => mockCssProperties[prop] || '',
        }) as CSSStyleDeclaration
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('manual mode', () => {
    it('should never auto-switch in manual mode', () => {
      const suggestion: AIContextSuggestion = {
        suggestedContext: 'personal',
        confidence: 0.95, // High confidence
      };

      const result = handleAIContextSuggestion(
        suggestion,
        { mode: 'manual' },
        'work'
      );

      expect(result).toBe(false);
      expect(getCurrentContext()).toBeNull(); // No context set
    });
  });

  describe('suggest mode', () => {
    it('should auto-switch when confidence > 80%', () => {
      const suggestion: AIContextSuggestion = {
        suggestedContext: 'rest',
        confidence: 0.85,
      };

      const result = handleAIContextSuggestion(
        suggestion,
        { mode: 'suggest' },
        'work'
      );

      expect(result).toBe(true);
      expect(getCurrentContext()).toBe('rest');
    });

    it('should not auto-switch when confidence <= 80%', () => {
      const suggestion: AIContextSuggestion = {
        suggestedContext: 'personal',
        confidence: 0.8,
      };

      const result = handleAIContextSuggestion(
        suggestion,
        { mode: 'suggest' },
        'work'
      );

      expect(result).toBe(false);
      expect(getCurrentContext()).toBeNull();
    });

    it('should not switch when confidence is low', () => {
      const suggestion: AIContextSuggestion = {
        suggestedContext: 'social',
        confidence: 0.5,
      };

      const result = handleAIContextSuggestion(
        suggestion,
        { mode: 'suggest' },
        'work'
      );

      expect(result).toBe(false);
    });
  });

  describe('auto mode', () => {
    it('should auto-switch when confidence > 60%', () => {
      const suggestion: AIContextSuggestion = {
        suggestedContext: 'social',
        confidence: 0.65,
      };

      const result = handleAIContextSuggestion(
        suggestion,
        { mode: 'auto' },
        'work'
      );

      expect(result).toBe(true);
      expect(getCurrentContext()).toBe('social');
    });

    it('should auto-switch with high confidence', () => {
      const suggestion: AIContextSuggestion = {
        suggestedContext: 'rest',
        confidence: 0.95,
      };

      const result = handleAIContextSuggestion(
        suggestion,
        { mode: 'auto' },
        'work'
      );

      expect(result).toBe(true);
      expect(getCurrentContext()).toBe('rest');
    });

    it('should not auto-switch when confidence <= 60%', () => {
      const suggestion: AIContextSuggestion = {
        suggestedContext: 'personal',
        confidence: 0.6,
      };

      const result = handleAIContextSuggestion(
        suggestion,
        { mode: 'auto' },
        'work'
      );

      expect(result).toBe(false);
      expect(getCurrentContext()).toBeNull();
    });

    it('should not switch when confidence is very low', () => {
      const suggestion: AIContextSuggestion = {
        suggestedContext: 'social',
        confidence: 0.3,
      };

      const result = handleAIContextSuggestion(
        suggestion,
        { mode: 'auto' },
        'work'
      );

      expect(result).toBe(false);
    });
  });

  describe('context matching', () => {
    it('should not switch if already in suggested context', () => {
      const suggestion: AIContextSuggestion = {
        suggestedContext: 'work',
        confidence: 0.95,
      };

      const result = handleAIContextSuggestion(
        suggestion,
        { mode: 'auto' },
        'work'
      );

      expect(result).toBe(false);
    });

    it('should not switch in suggest mode if contexts match', () => {
      const suggestion: AIContextSuggestion = {
        suggestedContext: 'personal',
        confidence: 0.9,
      };

      const result = handleAIContextSuggestion(
        suggestion,
        { mode: 'suggest' },
        'personal'
      );

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle exact confidence thresholds', () => {
      // Suggest mode: exactly 0.8 should NOT switch (> not >=)
      const suggestionSuggest: AIContextSuggestion = {
        suggestedContext: 'rest',
        confidence: 0.8,
      };
      expect(
        handleAIContextSuggestion(
          suggestionSuggest,
          { mode: 'suggest' },
          'work'
        )
      ).toBe(false);

      // Auto mode: exactly 0.6 should NOT switch (> not >=)
      const suggestionAuto: AIContextSuggestion = {
        suggestedContext: 'social',
        confidence: 0.6,
      };
      expect(
        handleAIContextSuggestion(suggestionAuto, { mode: 'auto' }, 'work')
      ).toBe(false);
    });

    it('should handle minimum and maximum confidence values', () => {
      const minConfidence: AIContextSuggestion = {
        suggestedContext: 'rest',
        confidence: 0,
      };
      expect(
        handleAIContextSuggestion(minConfidence, { mode: 'auto' }, 'work')
      ).toBe(false);

      const maxConfidence: AIContextSuggestion = {
        suggestedContext: 'rest',
        confidence: 1,
      };
      expect(
        handleAIContextSuggestion(maxConfidence, { mode: 'auto' }, 'work')
      ).toBe(true);
    });
  });

  describe('custom thresholds', () => {
    it('should respect custom suggestThreshold', () => {
      const suggestion: AIContextSuggestion = {
        suggestedContext: 'personal',
        confidence: 0.7,
      };

      // With custom threshold of 0.65, confidence 0.7 should trigger switch
      const result = handleAIContextSuggestion(
        suggestion,
        { mode: 'suggest', suggestThreshold: 0.65 },
        'work'
      );

      expect(result).toBe(true);
      expect(getCurrentContext()).toBe('personal');
    });

    it('should respect custom autoThreshold', () => {
      const suggestion: AIContextSuggestion = {
        suggestedContext: 'social',
        confidence: 0.5,
      };

      // With custom threshold of 0.4, confidence 0.5 should trigger switch
      const result = handleAIContextSuggestion(
        suggestion,
        { mode: 'auto', autoThreshold: 0.4 },
        'work'
      );

      expect(result).toBe(true);
      expect(getCurrentContext()).toBe('social');
    });

    it('should use default thresholds when not specified', () => {
      const suggestionSuggest: AIContextSuggestion = {
        suggestedContext: 'rest',
        confidence: 0.75,
      };

      // Should not switch (default suggest threshold is 0.8)
      expect(
        handleAIContextSuggestion(
          suggestionSuggest,
          { mode: 'suggest' },
          'work'
        )
      ).toBe(false);

      const suggestionAuto: AIContextSuggestion = {
        suggestedContext: 'personal',
        confidence: 0.55,
      };

      // Should not switch (default auto threshold is 0.6)
      expect(
        handleAIContextSuggestion(suggestionAuto, { mode: 'auto' }, 'work')
      ).toBe(false);
    });

    it('should handle higher custom thresholds', () => {
      const suggestion: AIContextSuggestion = {
        suggestedContext: 'rest',
        confidence: 0.85,
      };

      // With high threshold of 0.9, confidence 0.85 should NOT trigger switch
      const result = handleAIContextSuggestion(
        suggestion,
        { mode: 'suggest', suggestThreshold: 0.9 },
        'work'
      );

      expect(result).toBe(false);
      expect(getCurrentContext()).toBeNull();
    });
  });
});

describe('showContextSwitchNotification', () => {
  it('should call toast.success with correct message', () => {
    const toastSpy = vi.spyOn(toast, 'success');

    showContextSwitchNotification('personal');

    expect(toastSpy).toHaveBeenCalledWith('Switched to Personal context', {
      duration: 2000,
    });

    toastSpy.mockRestore();
  });

  it('should display correct label for each context type', () => {
    const toastSpy = vi.spyOn(toast, 'success');

    showContextSwitchNotification('work');
    expect(toastSpy).toHaveBeenCalledWith('Switched to Work context', {
      duration: 2000,
    });

    showContextSwitchNotification('rest');
    expect(toastSpy).toHaveBeenCalledWith('Switched to Rest context', {
      duration: 2000,
    });

    showContextSwitchNotification('social');
    expect(toastSpy).toHaveBeenCalledWith('Switched to Social context', {
      duration: 2000,
    });

    toastSpy.mockRestore();
  });
});
