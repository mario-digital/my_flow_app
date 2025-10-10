'use client';

import type { JSX } from 'react';
import { useEffect } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { FlowList } from '@/components/flows/flow-list';
import { useCurrentContext } from '@/components/providers/app-providers';
import { useContexts } from '@/hooks/use-contexts';
import { useFlows } from '@/hooks/use-flows';
import type { Flow } from '@/types/flow';

export default function DashboardPage(): JSX.Element {
  const { currentContextId, setCurrentContextId } = useCurrentContext();
  const { data: contexts, error: contextsError } = useContexts();
  const { data: flows, isLoading: flowsLoading } = useFlows(
    currentContextId ?? ''
  );

  // Auto-select first context if none selected
  useEffect(() => {
    if (!currentContextId && contexts && contexts.length > 0 && contexts[0]) {
      setCurrentContextId(contexts[0].id);
    }
  }, [currentContextId, contexts, setCurrentContextId]);

  // Error state for contexts
  if (contextsError) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-screen-xl">
        <div className="bg-alert-error-bg border border-alert-error-border rounded-md p-4">
          <p className="text-alert-error-text">
            Failed to load contexts. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-screen-xl lg:px-8">
      {/* Page header */}
      <h1 className="text-h1 font-bold text-text-primary mb-8">Dashboard</h1>

      {/* Main content grid - responsive two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left column: Flows */}
        <div className="space-y-4">
          <h2 className="text-h2 font-semibold text-text-primary mb-4">
            Flows
          </h2>

          {/* Loading state */}
          {flowsLoading && (
            <div className="space-y-3">
              <div className="h-24 bg-bg-tertiary rounded-card animate-pulse" />
              <div className="h-24 bg-bg-tertiary rounded-card animate-pulse" />
              <div className="h-24 bg-bg-tertiary rounded-card animate-pulse" />
            </div>
          )}

          {/* Empty state - no context selected */}
          {!currentContextId && !flowsLoading && (
            <div
              className="
              bg-bg-secondary border border-border-subtle
              rounded-card p-8 text-center
            "
            >
              <p className="text-text-secondary">
                Select a context to view flows
              </p>
            </div>
          )}

          {/* Empty state - no flows in context */}
          {currentContextId && !flowsLoading && flows?.length === 0 && (
            <div
              className="
              bg-bg-secondary border border-border-subtle
              rounded-card p-8 text-center
            "
            >
              <p className="text-text-secondary mb-2">
                No flows yet in this context
              </p>
              <p className="text-text-muted text-small">
                Start a conversation with AI to create flows
              </p>
            </div>
          )}

          {/* Flow list */}
          {flows && flows.length > 0 && (
            <FlowList
              flows={flows as Flow[]}
              onFlowClick={(id): void => console.log('Flow clicked:', id)}
              onFlowComplete={(id): void => console.log('Flow completed:', id)}
              onFlowDelete={(id): void => console.log('Flow deleted:', id)}
            />
          )}
        </div>

        {/* Right column: Chat */}
        <div className="space-y-4">
          <h2 className="text-h2 font-semibold text-text-primary mb-4">
            Conversation
          </h2>

          {/* Empty state - no context selected */}
          {!currentContextId && (
            <div
              className="
              bg-bg-secondary border border-border-subtle
              rounded-card p-8 text-center
            "
            >
              <p className="text-text-secondary">
                Select a context to start a conversation
              </p>
            </div>
          )}

          {/* Chat interface */}
          {currentContextId && (
            <ChatInterface
              contextId={currentContextId}
              onFlowsExtracted={(flows: Flow[]) => {
                console.log('Flows extracted from conversation:', flows);
                // Future: Show toast notification
              }}
              className="h-[600px]"
            />
          )}
        </div>
      </div>
    </div>
  );
}
