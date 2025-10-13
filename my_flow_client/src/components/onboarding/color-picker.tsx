'use client';

import type { ReactElement } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Cyan', value: '#06b6d4' },
];

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  className,
}: ColorPickerProps): ReactElement {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-small font-medium text-text-primary">
        Choose a color
      </label>

      <div className="grid grid-cols-8 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            aria-label={`Select ${color.name}`}
            className={cn(
              // Base button styling
              'relative',
              'flex items-center justify-center',
              'w-10 h-10',
              'rounded-full',
              'border-2',
              'transition-all duration-fast ease-out',

              // Border
              value === color.value
                ? 'border-text-primary'
                : 'border-border-subtle',

              // Hover
              'hover:scale-110',
              'hover:border-text-secondary'
            )}
            style={{ backgroundColor: color.value }}
          >
            {value === color.value && (
              <Check className="w-5 h-5 text-white drop-shadow-lg" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
