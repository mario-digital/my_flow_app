'use client';

import { useState, type ReactElement } from 'react';
import { Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/onboarding/emoji-picker';
import { ColorPicker } from '@/components/onboarding/color-picker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface AddContextCardProps {
  onContextCreated: (contextId: string) => void;
  className?: string;
}

/**
 * Add Context Card component.
 * Shows a plus icon initially, expands to creation form on click.
 * After creating context, automatically switches to it and closes the form.
 */
export function AddContextCard({
  onContextCreated,
  className,
}: AddContextCardProps): ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [contextName, setContextName] = useState('');
  const [contextIcon, setContextIcon] = useState('📋');
  const [contextColor, setContextColor] = useState('#6366f1');

  const handleCreate = async (): Promise<void> => {
    if (!contextName.trim()) {
      toast.error('Please enter a context name');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/contexts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: contextName.trim(),
          icon: contextIcon,
          color: contextColor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create context');
      }

      const newContext = (await response.json()) as { id: string };

      toast.success(`Context "${contextName}" created!`);

      // Reset form
      setContextName('');
      setContextIcon('📋');
      setContextColor('#6366f1');
      setIsExpanded(false);

      // Notify parent to switch to new context
      onContextCreated(newContext.id);
    } catch (error) {
      console.error('Error creating context:', error);
      toast.error('Failed to create context. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = (): void => {
    setIsExpanded(false);
    setContextName('');
    setContextIcon('📋');
    setContextColor('#6366f1');
  };

  // Collapsed state - just show plus icon
  if (!isExpanded) {
    return (
      <Card
        className={cn(
          // Base card styling - component-styling-guide.md#528-569
          'bg-card',
          'text-card-text',
          'border-card-border',
          'rounded-card',
          'shadow-card',

          // Interactive styling
          'cursor-pointer',
          'transition-all duration-fast ease-out',
          'hover:bg-card-bg-hover hover:shadow-card-hover',
          'hover:-translate-y-0.5',

          // Flexbox for centering
          'flex items-center justify-center',
          'min-h-[200px]',

          className
        )}
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex flex-col items-center gap-2">
          <Plus className="w-12 h-12 text-context-accent" />
          <span className="text-sm font-medium text-text-secondary">
            Add Context
          </span>
        </div>
      </Card>
    );
  }

  // Expanded state - show creation form
  return (
    <Card
      className={cn(
        // Base card styling
        'bg-card',
        'text-card-text',
        'border-card-border',
        'rounded-card',
        'shadow-card',

        // Expanded card specific styling
        'p-6',
        'min-h-[200px]',

        className
      )}
    >
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text-primary">
          Create New Context
        </h3>
        <button
          onClick={handleCancel}
          disabled={isCreating}
          className="text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-bg-secondary rounded-lg">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full text-base"
          style={{ backgroundColor: contextColor }}
        >
          {contextIcon}
        </div>
        <span className="text-sm font-medium text-text-primary">
          {contextName || 'New Context'}
        </span>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Context Name Input */}
        <div className="space-y-2">
          <label
            htmlFor="new-context-name"
            className="text-xs font-medium text-text-primary"
          >
            Context Name
          </label>
          <input
            id="new-context-name"
            type="text"
            value={contextName}
            onChange={(e) => setContextName(e.target.value)}
            placeholder="e.g., Work, Personal, Hobbies..."
            maxLength={50}
            disabled={isCreating}
            className="
              w-full h-10
              bg-input
              text-input-text
              placeholder:text-input-placeholder
              border border-input-border
              px-3 py-2
              rounded-input
              text-sm font-normal
              transition-all duration-fast ease-out
              hover:border-input-border-hover
              focus:outline-none focus:border-input-border-focus
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />
        </div>

        {/* Emoji Picker */}
        <EmojiPicker value={contextIcon} onChange={setContextIcon} />

        {/* Color Picker */}
        <ColorPicker value={contextColor} onChange={setContextColor} />

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => void handleCreate()}
            disabled={isCreating || !contextName.trim()}
            className="flex-1"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isCreating}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}
