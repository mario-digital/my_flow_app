'use client';

import type { ReactElement } from 'react';
import { Sparkles, FolderKanban, Zap } from 'lucide-react';

export function WelcomeStep(): ReactElement {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3" aria-hidden="true">
        <div className="flex justify-center">
          <Sparkles className="w-12 h-12 text-context" />
        </div>

        <h2 className="text-h2 font-semibold text-text-primary">
          Welcome to My Flow
        </h2>

        <p className="text-base text-text-secondary leading-relaxed max-w-md mx-auto">
          Organize your life with contexts and flows. Let&apos;s get you
          started!
        </p>
      </div>

      {/* Features */}
      <div className="space-y-4">
        {/* Contexts */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-bg-tertiary rounded-lg">
            <FolderKanban className="w-5 h-5 text-context" />
          </div>
          <div>
            <h3 className="text-base font-medium text-text-primary mb-1">
              Contexts
            </h3>
            <p className="text-small text-text-secondary leading-relaxed">
              Organize your flows into contexts like Work, Personal, Rest, and
              Social.
            </p>
          </div>
        </div>

        {/* Flows */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-bg-tertiary rounded-lg">
            <Zap className="w-5 h-5 text-context" />
          </div>
          <div>
            <h3 className="text-base font-medium text-text-primary mb-1">
              Flows
            </h3>
            <p className="text-small text-text-secondary leading-relaxed">
              Break down your tasks into flows. Chat with AI to extract and
              manage them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
