'use client';

import type { ReactElement } from 'react';
import { Sparkles, Plus } from 'lucide-react';

export interface SampleDataStepProps {
  onCreateSampleData: () => void;
  onStartFresh: () => void;
}

export function SampleDataStep({
  onCreateSampleData,
  onStartFresh,
}: SampleDataStepProps): ReactElement {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2" aria-hidden="true">
        <h2 className="text-h2 font-semibold text-text-primary">
          Ready to Get Started?
        </h2>
        <p className="text-base text-text-secondary leading-relaxed">
          Choose how you&apos;d like to begin your journey.
        </p>
      </div>

      {/* Options */}
      <div className="grid gap-4">
        {/* Sample Data Option */}
        <button
          onClick={onCreateSampleData}
          className="
            flex items-start gap-4
            p-6
            bg-card
            border-2 border-card-border
            rounded-card
            shadow-card
            text-left
            transition-all duration-fast ease-out
            hover:bg-card-bg-hover
            hover:border-context
            hover:shadow-card-hover
            hover:-translate-y-0.5
          "
        >
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-context/10 rounded-lg">
            <Sparkles className="w-6 h-6 text-context" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-text-primary mb-2">
              Create Sample Data
            </h3>
            <p className="text-small text-text-secondary leading-relaxed">
              Get started quickly with 4 pre-filled contexts (Work, Personal,
              Rest, Social) and sample flows to explore the app.
            </p>
          </div>
        </button>

        {/* Start Fresh Option */}
        <button
          onClick={onStartFresh}
          className="
            flex items-start gap-4
            p-6
            bg-card
            border-2 border-card-border
            rounded-card
            shadow-card
            text-left
            transition-all duration-fast ease-out
            hover:bg-card-bg-hover
            hover:border-border-hover
            hover:shadow-card-hover
            hover:-translate-y-0.5
          "
        >
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-bg-tertiary rounded-lg">
            <Plus className="w-6 h-6 text-text-secondary" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-text-primary mb-2">
              Start Fresh
            </h3>
            <p className="text-small text-text-secondary leading-relaxed">
              Begin with a clean slate and create your own contexts and flows
              from scratch.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
