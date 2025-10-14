'use client';

import type { JSX } from 'react';
import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChatInterface } from '@/components/chat/chat-interface';
import { FlowList } from '@/components/flows/flow-list';
import { ContextSummaryWidget } from '@/components/dashboard/context-summary-widget';
import { useCurrentContext } from '@/components/providers/app-providers';
import { useContexts } from '@/hooks/use-contexts';
import { useFlows, flowKeys } from '@/hooks/use-flows';
import { completeFlow, deleteFlow } from '@/lib/api/flows';
import type { Flow } from '@/types/flow';

const CHAT_PANEL_HEIGHT = 'var(--dashboard-chat-panel-height, 37.5rem)';

export function DashboardContent(): JSX.Element {
  const { currentContextId, setCurrentContextId } = useCurrentContext();
  const { data: contexts, error: contextsError } = useContexts();
  const { data: flows, isLoading: flowsLoading } = useFlows(
    currentContextId ?? ''
  );
  const queryClient = useQueryClient();

  const handleFlowClick = useCallback((id: string): void => {
    toast.info(`Flow ${id} navigation is coming soon.`);
  }, []);

  const handleFlowComplete = useCallback(
    (id: string): void => {
      if (!currentContextId) return;

      // Optimistically update the UI
      queryClient.setQueryData<Flow[]>(
        flowKeys.list(currentContextId),
        (old) =>
          old?.map((flow) =>
            flow.id === id
              ? {
                  ...flow,
                  is_completed: !flow.is_completed,
                  completed_at: !flow.is_completed
                    ? new Date().toISOString()
                    : undefined,
                }
              : flow
          ) ?? []
      );

      // Call the API (fire-and-forget)
      void completeFlow(id)
        .then(() => {
          // Invalidate to refetch fresh data from server
          void queryClient.invalidateQueries({
            queryKey: flowKeys.list(currentContextId),
          });
          toast.success('Flow marked as complete!');
        })
        .catch((error: unknown) => {
          // Revert on error
          void queryClient.invalidateQueries({
            queryKey: flowKeys.list(currentContextId),
          });
          toast.error(
            `Failed to mark flow complete: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        });
    },
    [currentContextId, queryClient]
  );

  const handleFlowDelete = useCallback(
    (id: string): void => {
      if (!currentContextId) return;

      // Optimistically remove from UI
      queryClient.setQueryData<Flow[]>(
        flowKeys.list(currentContextId),
        (old) => old?.filter((flow) => flow.id !== id) ?? []
      );

      // Call the API (fire-and-forget)
      void deleteFlow(id)
        .then(() => {
          // Invalidate to refetch fresh data
          void queryClient.invalidateQueries({
            queryKey: flowKeys.list(currentContextId),
          });
          toast.success('Flow deleted successfully!');
        })
        .catch((error: unknown) => {
          // Revert on error
          void queryClient.invalidateQueries({
            queryKey: flowKeys.list(currentContextId),
          });
          toast.error(
            `Failed to delete flow: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        });
    },
    [currentContextId, queryClient]
  );

  const handleContextClick = useCallback(
    (contextId: string): void => {
      setCurrentContextId(contextId);
      toast.success('Context switched!');
    },
    [setCurrentContextId]
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

      {/* Context Summary Widget */}
      <div className="mb-8">
        <h2 className="text-h2 font-semibold text-text-primary mb-4">
          My Contexts
        </h2>
        <ContextSummaryWidget onContextClick={handleContextClick} />
      </div>

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
              onFlowClick={handleFlowClick}
              onFlowComplete={handleFlowComplete}
              onFlowDelete={handleFlowDelete}
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
            <div style={{ height: CHAT_PANEL_HEIGHT }} className="h-full">
              <ChatInterface
                contextId={currentContextId}
                onFlowsExtracted={(flows: Flow[]) => {
                  if (flows.length > 0) {
                    toast.success(
                      `${flows.length} flow${
                        flows.length > 1 ? 's' : ''
                      } refreshed from conversation.`
                    );
                  } else {
                    toast.info('Flow suggestions are refreshing.');
                  }
                }}
                className="h-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
