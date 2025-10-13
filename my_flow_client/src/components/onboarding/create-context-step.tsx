'use client';

import type { ReactElement } from 'react';
import { EmojiPicker } from './emoji-picker';
import { ColorPicker } from './color-picker';

export interface CreateContextStepProps {
  contextName: string;
  contextIcon: string;
  contextColor: string;
  onContextNameChange: (name: string) => void;
  onContextIconChange: (icon: string) => void;
  onContextColorChange: (color: string) => void;
}

export function CreateContextStep({
  contextName,
  contextIcon,
  contextColor,
  onContextNameChange,
  onContextIconChange,
  onContextColorChange,
}: CreateContextStepProps): ReactElement {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2" aria-hidden="true">
        <h2 className="text-h2 font-semibold text-text-primary">
          Create Your First Context
        </h2>
        <p className="text-base text-text-secondary leading-relaxed">
          Contexts help you organize flows by area of life.
        </p>
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        <div
          className="
            flex items-center gap-3
            px-6 py-4
            bg-card
            border border-card-border
            rounded-card
            shadow-card
          "
        >
          <div
            className="
              flex items-center justify-center
              w-12 h-12
              rounded-full
              text-xl
            "
            style={{ backgroundColor: contextColor }}
          >
            {contextIcon}
          </div>
          <span className="text-base font-medium text-text-primary">
            {contextName || 'My Context'}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Context Name Input */}
        <div className="space-y-2">
          <label
            htmlFor="context-name"
            className="text-small font-medium text-text-primary"
          >
            Context Name
          </label>
          <input
            id="context-name"
            type="text"
            value={contextName}
            onChange={(e) => onContextNameChange(e.target.value)}
            placeholder="e.g., Work, Personal, Rest..."
            maxLength={50}
            className="
              w-full h-11
              bg-input
              text-input-text
              placeholder:text-input-placeholder
              border border-input-border
              px-4 py-3
              rounded-input
              text-base font-normal leading-normal
              transition-all duration-fast ease-out
              hover:border-input-border-hover
              focus:outline-none focus:border-input-border-focus
              focus:shadow-[var(--input-shadow-focus)]
            "
          />
        </div>

        {/* Emoji Picker */}
        <EmojiPicker value={contextIcon} onChange={onContextIconChange} />

        {/* Color Picker */}
        <ColorPicker value={contextColor} onChange={onContextColorChange} />
      </div>
    </div>
  );
}
