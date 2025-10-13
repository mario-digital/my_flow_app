'use client';

import { type ReactElement } from 'react';
import { cn } from '@/lib/utils';

const PRESET_EMOJIS = [
  '💼',
  '📊',
  '💻',
  '📱', // Work
  '🏠',
  '🎯',
  '✨',
  '🔥', // Personal
  '😴',
  '🌙',
  '🧘',
  '📚', // Rest
  '🎉',
  '🎮',
  '🎬',
  '🎨', // Social
  '❤️',
  '⭐',
  '🚀',
  '🌟', // Other
];

export interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({
  value,
  onChange,
  className,
}: EmojiPickerProps): ReactElement {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-small font-medium text-text-primary">
        Choose an icon
      </label>

      <div className="grid grid-cols-8 gap-2">
        {PRESET_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              // Base button styling
              'flex items-center justify-center',
              'w-10 h-10',
              'text-lg',
              'bg-bg-secondary',
              'border border-border-default',
              'rounded-md',
              'transition-all duration-fast ease-out',

              // Hover
              'hover:bg-bg-tertiary hover:border-border-hover',
              'hover:scale-110',

              // Selected state
              value === emoji && [
                'bg-bg-elevated',
                'border-context',
                'shadow-focus',
              ]
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
