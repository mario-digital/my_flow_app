'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  fetchFlowsByContext,
  fetchFlowById,
  createFlow,
  updateFlow,
  deleteFlow,
  completeFlow,
} from '@/lib/api/flows';
import { transformError } from '@/lib/errors';
import { FLOW_MESSAGES } from '@/lib/messages/flows';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { components } from '@/types/api';

// Type aliases from generated OpenAPI typings per coding standards Section 1
type Flow = components['schemas']['FlowInDB'];
type FlowCreate = components['schemas']['FlowCreate'];
type FlowUpdate = components['schemas']['FlowUpdate'];

/**
 * Hierarchical query key factory for flows.
 *
 * Provides type-safe query keys following TanStack Query best practices.
 * The hierarchical structure enables efficient cache invalidation:
 * - Invalidating flowKeys.all clears all flow-related queries
 * - Invalidating flowKeys.lists() clears all list queries
 * - Invalidating flowKeys.list(contextId) clears a specific context's list
 *
 * @example
 * ```typescript
 * // In a query
 * queryKey: flowKeys.list(contextId)
 *
 * // In cache invalidation
 * queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
 * ```
 */
export const flowKeys = {
  all: ['flows'] as const,
  lists: () => [...flowKeys.all, 'list'] as const,
  list: (contextId: string) => [...flowKeys.lists(), contextId] as const,
  details: () => [...flowKeys.all, 'detail'] as const,
  detail: (id: string) => [...flowKeys.details(), id] as const,
};

/**
 * Hierarchical mutation key factory for flows.
 *
 * Provides type-safe mutation keys to prevent duplicate submissions
 * and enable granular mutation tracking. Each mutation type has its
 * own key to prevent collisions between concurrent operations.
 *
 * @example
 * ```typescript
 * // In a mutation
 * mutationKey: flowMutations.create
 * mutationKey: flowMutations.update(flowId)
 * ```
 */
export const flowMutations = {
  create: ['flows', 'create'] as const,
  update: (id: string) => ['flows', 'update', id] as const,
  delete: (id: string) => ['flows', 'delete', id] as const,
  complete: (id: string) => ['flows', 'complete', id] as const,
};

/**
 * Fetches all flows for a specific context with automatic refetching and caching.
 *
 * This query hook provides:
 * - Automatic refetching on window focus
 * - 2-minute stale time (flows change more frequently than contexts)
 * - 5-minute garbage collection time to prevent premature eviction
 * - Authentication guard (requires authenticated user)
 *
 * **Error Handling**: Query errors are exposed via the `error` property.
 * Consuming components should watch `error` and display toast notifications:
 *
 * ```typescript
 * const { data, error } = useFlows(contextId);
 *
 * useEffect(() => {
 *   if (error) {
 *     const appError = transformError(error);
 *     toast.error(appError.userMessage ?? FLOW_MESSAGES.fetchListError);
 *   }
 * }, [error]);
 * ```
 *
 * @param contextId - Context ID to fetch flows for
 * @returns TanStack Query result with { data, isLoading, error, refetch }
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * const { data: flows, isLoading } = useFlows('507f1f77bcf86cd799439022');
 *
 * if (isLoading) return <LoadingSpinner />;
 * return <FlowList flows={flows} />;
 * ```
 */
export function useFlows(contextId: string): UseQueryResult<Flow[], Error> {
  const { userId, isAuthenticated } = useCurrentUser();

  if (!isAuthenticated || !userId) {
    throw new Error('useFlows requires an authenticated user');
  }

  return useQuery({
    queryKey: flowKeys.list(contextId),
    queryFn: () => fetchFlowsByContext(contextId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (garbage collection)
    refetchOnWindowFocus: true,
    enabled: !!contextId,
  });
}

/**
 * Fetches a single flow by ID with automatic caching.
 *
 * This query hook provides:
 * - 2-minute stale time
 * - 2-minute garbage collection (shorter than list to avoid cache bloat)
 * - Returns null for 404 errors (missing flow treated as empty state)
 *
 * **Error Handling**: Query errors are exposed via the `error` property.
 * Consuming components or error boundaries should surface errors via toast.
 *
 * **Prefetching**: Consider using `prefetchFlow(id)` helper to warm the
 * detail cache ahead of navigation or hover events.
 *
 * @param id - Flow ID to fetch
 * @returns TanStack Query result with { data, isLoading, error }
 *
 * @example
 * ```typescript
 * const { data: flow } = useFlow('507f1f77bcf86cd799439011');
 *
 * if (!flow) return <NotFound />;
 * return <FlowDetail flow={flow} />;
 * ```
 */
export function useFlow(id: string): UseQueryResult<Flow | null, Error> {
  return useQuery({
    queryKey: flowKeys.detail(id),
    queryFn: () => fetchFlowById(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 2 * 60 * 1000, // shorter GC window to avoid cache bloat
    enabled: !!id,
  });
}

/**
 * Creates a new flow with optimistic updates for instant UI feedback.
 *
 * **Optimistic Update Flow**:
 * 1. Immediately adds flow to cache with temporary ID
 * 2. Sends request to server
 * 3. On success: Replaces temp entry with server response
 * 4. On error: Rolls back to previous state and shows error toast
 *
 * **Mutation Key**: Uses `flowMutations.create` to prevent duplicate
 * submissions from double-clicks.
 *
 * @param contextId - Context ID where the flow will be created
 * @returns TanStack Query mutation result with { mutate, mutateAsync, isPending }
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * const createFlowMutation = useCreateFlow(contextId);
 *
 * const handleSubmit = (data: FlowCreate) => {
 *   createFlowMutation.mutate(data);
 * };
 * ```
 */
export function useCreateFlow(
  contextId: string
): UseMutationResult<Flow, Error, FlowCreate> {
  const queryClient = useQueryClient();
  const { userId, isAuthenticated } = useCurrentUser();

  if (!isAuthenticated || !userId) {
    throw new Error(
      'useCreateFlow requires an authenticated user from useCurrentUser()'
    );
  }

  return useMutation({
    mutationKey: flowMutations.create,
    mutationFn: (data: FlowCreate) => createFlow(data),

    // Optimistic update: Add flow to cache immediately
    onMutate: async (newFlow) => {
      await queryClient.cancelQueries({ queryKey: flowKeys.list(contextId) });

      const previousFlows = queryClient.getQueryData<Flow[]>(
        flowKeys.list(contextId)
      );

      // Optimistically add new flow with unique temporary ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimisticFlow: Flow = {
        id: tempId,
        context_id: contextId,
        user_id: userId,
        title: newFlow.title,
        description: newFlow.description ?? null,
        priority: newFlow.priority,
        is_completed: false,
        due_date: newFlow.due_date ?? null,
        reminder_enabled: newFlow.reminder_enabled,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };

      queryClient.setQueryData<Flow[]>(flowKeys.list(contextId), (old) => [
        ...(old || []),
        optimisticFlow,
      ]);

      return { previousFlows, tempId };
    },

    // On error: Rollback to previous state
    onError: (err, _newFlow, context) => {
      if (context?.previousFlows) {
        queryClient.setQueryData(
          flowKeys.list(contextId),
          context.previousFlows
        );
      }
      const appError = transformError(err);
      toast.error(appError.userMessage ?? FLOW_MESSAGES.createError);
      console.error(FLOW_MESSAGES.createError, err); // Keep for debugging
    },

    // On success: Replace optimistic data with server response
    onSuccess: (createdFlow, _variables, context) => {
      // Replace optimistic entry (temp ID) with real server response before refetch
      queryClient.setQueryData<Flow[]>(
        flowKeys.list(contextId),
        (old) =>
          old?.map((flow) =>
            context?.tempId && flow.id === context.tempId ? createdFlow : flow
          ) ?? []
      );

      void queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
      toast.success(FLOW_MESSAGES.createSuccess);
    },
  });
}

/**
 * Updates a flow with optimistic updates for both list and detail caches.
 *
 * **Optimistic Update Flow**:
 * 1. Immediately updates flow in both list and detail caches
 * 2. Sends request to server
 * 3. On success: Invalidates caches to sync with server
 * 4. On error: Rolls back to previous state and shows error toast
 *
 * **Mutation Key**: Uses `flowMutations.update(id)` to isolate concurrent
 * updates to different flows.
 *
 * @param id - Flow ID to update
 * @param contextId - Context ID the flow belongs to
 * @returns TanStack Query mutation result
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * const updateFlowMutation = useUpdateFlow(flowId, contextId);
 *
 * updateFlowMutation.mutate({
 *   title: 'Updated title',
 *   priority: 'high'
 * });
 * ```
 */
export function useUpdateFlow(
  id: string,
  contextId: string
): UseMutationResult<Flow, Error, FlowUpdate> {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useCurrentUser();

  if (!isAuthenticated) {
    throw new Error('useUpdateFlow requires an authenticated user');
  }

  return useMutation({
    mutationKey: flowMutations.update(id),
    mutationFn: (data: FlowUpdate) => updateFlow(id, data),

    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: flowKeys.list(contextId) });
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(id) });

      const previousList = queryClient.getQueryData<Flow[]>(
        flowKeys.list(contextId)
      );
      const previousDetail = queryClient.getQueryData<Flow>(
        flowKeys.detail(id)
      );

      // Optimistically update list cache
      queryClient.setQueryData<Flow[]>(
        flowKeys.list(contextId),
        (old) =>
          old?.map((flow) =>
            flow.id === id ? ({ ...flow, ...updatedData } as Flow) : flow
          ) ?? []
      );

      // Optimistically update detail cache
      if (previousDetail) {
        queryClient.setQueryData<Flow>(flowKeys.detail(id), {
          ...previousDetail,
          ...updatedData,
        } as Flow);
      }

      return { previousList, previousDetail };
    },

    onError: (err, _data, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(
          flowKeys.list(contextId),
          context.previousList
        );
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(flowKeys.detail(id), context.previousDetail);
      }
      const appError = transformError(err);
      toast.error(appError.userMessage ?? FLOW_MESSAGES.updateError);
      console.error(FLOW_MESSAGES.updateError, err);
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: flowKeys.list(contextId),
      });
      void queryClient.invalidateQueries({ queryKey: flowKeys.detail(id) });
      toast.success(FLOW_MESSAGES.updateSuccess);
    },
  });
}

/**
 * Deletes a flow with optimistic removal from list cache.
 *
 * **Optimistic Update Flow**:
 * 1. Immediately removes flow from list cache
 * 2. Sends delete request to server
 * 3. On success: Invalidates list cache to sync
 * 4. On error: Restores flow to list and shows error toast
 *
 * **Mutation Key**: Uses `flowMutations.delete(id)` for isolation.
 *
 * @param id - Flow ID to delete
 * @param contextId - Context ID the flow belongs to
 * @returns TanStack Query mutation result
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * const deleteFlowMutation = useDeleteFlow(flowId, contextId);
 *
 * const handleDelete = () => {
 *   if (confirm('Delete this flow?')) {
 *     deleteFlowMutation.mutate();
 *   }
 * };
 * ```
 */
export function useDeleteFlow(
  id: string,
  contextId: string
): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useCurrentUser();

  if (!isAuthenticated) {
    throw new Error('useDeleteFlow requires an authenticated user');
  }

  return useMutation({
    mutationKey: flowMutations.delete(id),
    mutationFn: () => deleteFlow(id),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: flowKeys.list(contextId) });

      const previousFlows = queryClient.getQueryData<Flow[]>(
        flowKeys.list(contextId)
      );

      // Optimistically remove flow from list
      queryClient.setQueryData<Flow[]>(
        flowKeys.list(contextId),
        (old) => old?.filter((flow) => flow.id !== id) ?? []
      );

      return { previousFlows };
    },

    onError: (err, _variables, context) => {
      if (context?.previousFlows) {
        queryClient.setQueryData(
          flowKeys.list(contextId),
          context.previousFlows
        );
      }
      const appError = transformError(err);
      toast.error(appError.userMessage ?? FLOW_MESSAGES.deleteError);
      console.error(FLOW_MESSAGES.deleteError, err);
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: flowKeys.list(contextId),
      });
      toast.success(FLOW_MESSAGES.deleteSuccess);
    },
  });
}

/**
 * Toggles flow completion status with optimistic update.
 *
 * **Optimistic Update Flow**:
 * 1. Immediately toggles is_completed in both list and detail caches
 * 2. Sends PATCH request to server
 * 3. On success: Replaces with server response (includes completed_at timestamp)
 * 4. On error: Restores previous state and shows error toast
 *
 * **Mutation Key**: Uses `flowMutations.complete(id)` for isolation.
 *
 * @param id - Flow ID to toggle completion
 * @param contextId - Context ID the flow belongs to
 * @returns TanStack Query mutation result
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * const completeFlowMutation = useCompleteFlow(flowId, contextId);
 *
 * const handleToggle = () => {
 *   completeFlowMutation.mutate();
 * };
 * ```
 */
export function useCompleteFlow(
  id: string,
  contextId: string
): UseMutationResult<Flow, Error, void> {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useCurrentUser();

  if (!isAuthenticated) {
    throw new Error('useCompleteFlow requires an authenticated user');
  }

  return useMutation({
    mutationKey: flowMutations.complete(id),
    mutationFn: () => completeFlow(id),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: flowKeys.list(contextId) });
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(id) });

      const previousList = queryClient.getQueryData<Flow[]>(
        flowKeys.list(contextId)
      );
      const previousDetail = queryClient.getQueryData<Flow>(
        flowKeys.detail(id)
      );

      // Optimistically toggle completion in list cache
      queryClient.setQueryData<Flow[]>(
        flowKeys.list(contextId),
        (old) =>
          old?.map((flow) =>
            flow.id === id
              ? {
                  ...flow,
                  is_completed: !flow.is_completed,
                  completed_at: !flow.is_completed
                    ? new Date().toISOString()
                    : null,
                }
              : flow
          ) ?? []
      );

      // Optimistically toggle completion in detail cache
      if (previousDetail) {
        queryClient.setQueryData<Flow>(flowKeys.detail(id), {
          ...previousDetail,
          is_completed: !previousDetail.is_completed,
          completed_at: !previousDetail.is_completed
            ? new Date().toISOString()
            : null,
        });
      }

      return { previousList, previousDetail };
    },

    onError: (err, _variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(
          flowKeys.list(contextId),
          context.previousList
        );
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(flowKeys.detail(id), context.previousDetail);
      }
      const appError = transformError(err);
      toast.error(appError.userMessage ?? FLOW_MESSAGES.completeError);
      console.error(FLOW_MESSAGES.completeError, err);
    },

    onSuccess: (updatedFlow) => {
      // Replace optimistic data with server response before invalidation
      queryClient.setQueryData<Flow[]>(
        flowKeys.list(contextId),
        (old) => old?.map((flow) => (flow.id === id ? updatedFlow : flow)) ?? []
      );
      queryClient.setQueryData<Flow>(flowKeys.detail(id), updatedFlow);

      void queryClient.invalidateQueries({
        queryKey: flowKeys.list(contextId),
      });
      void queryClient.invalidateQueries({ queryKey: flowKeys.detail(id) });
      toast.success(FLOW_MESSAGES.completeSuccess);
    },
  });
}
