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
  fetchContexts,
  fetchContextById,
  createContext,
  updateContext,
  deleteContext,
} from '@/lib/api/contexts';
import { transformError } from '@/lib/errors';
import { CONTEXT_MESSAGES } from '@/lib/messages/contexts';
import type { components } from '@/types/api';

// Type aliases from generated OpenAPI typings
type Context = components['schemas']['ContextInDB'];
type ContextCreate = components['schemas']['ContextCreate'];
type ContextUpdate = components['schemas']['ContextUpdate'];

type CreateContextMutationContext = {
  previousContexts: Context[];
  tempId: string;
};

type UpdateContextMutationContext = {
  previousContext?: Context;
  previousContexts: Context[];
};

type DeleteContextMutationContext = {
  previousContexts: Context[];
};

/**
 * Hierarchical query keys for context-related queries.
 *
 * This pattern allows efficient cache invalidation:
 * - Invalidate all context queries: contextKeys.all
 * - Invalidate all lists: contextKeys.lists()
 * - Invalidate specific user list: contextKeys.list(userId)
 * - Invalidate all details: contextKeys.details()
 * - Invalidate specific context: contextKeys.detail(id)
 *
 * Uses `as const` for TypeScript type inference.
 */
export const contextKeys = {
  all: ['contexts'] as const,
  lists: () => [...contextKeys.all, 'list'] as const,
  list: (userId: string) => [...contextKeys.lists(), userId] as const,
  details: () => [...contextKeys.all, 'detail'] as const,
  detail: (id: string) => [...contextKeys.details(), id] as const,
};

/**
 * Hierarchical mutation keys for context-related mutations.
 *
 * Mutation keys prevent duplicate submissions from double-clicks or rapid
 * interactions. Each mutation type has a unique key:
 * - create: shared key for all context creations
 * - update: scoped per context ID to isolate concurrent updates
 * - delete: scoped per context ID to isolate concurrent deletes
 *
 * Uses `as const` for TypeScript type inference.
 */
export const contextMutations = {
  create: ['contexts', 'create'] as const,
  update: (id: string) => ['contexts', 'update', id] as const,
  delete: (id: string) => ['contexts', 'delete', id] as const,
};

// Export key factories for use in tests and components
export { contextKeys as queryKeys, contextMutations as mutationKeys };

// Import useCurrentUser hook for authenticated queries
import { useCurrentUser } from './use-current-user';

/**
 * Query hook to fetch all contexts for the authenticated user.
 *
 * Fetches the user's context list with automatic caching and refetching.
 * Query configuration follows best practices:
 * - staleTime: 5 minutes (contexts change infrequently)
 * - gcTime: 10 minutes (prevents premature cache eviction)
 * - refetchOnWindowFocus: true (auto-sync when user returns to tab)
 * - enabled: only runs when user is authenticated
 *
 * @returns TanStack Query result with { data, isLoading, error, refetch }
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * function ContextList() {
 *   const { data: contexts, isLoading, error } = useContexts();
 *
 *   useEffect(() => {
 *     if (error) {
 *       const appError = transformError(error);
 *       toast.error(appError.userMessage ?? CONTEXT_MESSAGES.fetchListError);
 *     }
 *   }, [error]);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   return <div>{contexts?.map(ctx => <div key={ctx.id}>{ctx.name}</div>)}</div>;
 * }
 * ```
 */
export function useContexts(): UseQueryResult<Context[], Error> {
  const { userId, isAuthenticated } = useCurrentUser();

  if (!isAuthenticated || !userId) {
    throw new Error('useContexts requires an authenticated user');
  }

  return useQuery<Context[], Error>({
    queryKey: contextKeys.list(userId),
    queryFn: fetchContexts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection)
    refetchOnWindowFocus: true,
    enabled: true,
  });
}

/**
 * Query hook to fetch a single context by ID.
 *
 * Fetches a specific context with shorter cache retention to avoid bloat.
 * Returns null if context is not found (404).
 *
 * @param id - Context ID to fetch
 * @returns TanStack Query result with { data, isLoading, error }
 *
 * @example
 * ```typescript
 * function ContextDetail({ id }: { id: string }) {
 *   const { data: context, isLoading, error } = useContext(id);
 *
 *   useEffect(() => {
 *     if (error) {
 *       const appError = transformError(error);
 *       toast.error(appError.userMessage ?? CONTEXT_MESSAGES.fetchDetailError);
 *     }
 *   }, [error]);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!context) return <div>Context not found</div>;
 *   return <div>{context.name}</div>;
 * }
 * ```
 */
export function useContext(id: string): UseQueryResult<Context | null, Error> {
  return useQuery<Context | null, Error>({
    queryKey: contextKeys.detail(id),
    queryFn: () => fetchContextById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 2 * 60 * 1000, // 2 minutes (shorter to avoid cache bloat)
    enabled: !!id,
  });
}

/**
 * Mutation hook to create a new context with optimistic update.
 *
 * Creates a context and immediately updates the cache optimistically for instant
 * UI feedback. Rolls back on error and shows appropriate toast notifications.
 *
 * @returns TanStack Mutation result with { mutate, mutateAsync, isPending, error }
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * function CreateContextForm() {
 *   const { mutate: createContextMutation, isPending } = useCreateContext();
 *
 *   const handleSubmit = (data: ContextCreate) => {
 *     createContextMutation(data);
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useCreateContext(): UseMutationResult<
  Context,
  Error,
  ContextCreate,
  CreateContextMutationContext
> {
  const queryClient = useQueryClient();
  const { userId, isAuthenticated } = useCurrentUser();

  if (!isAuthenticated || !userId) {
    throw new Error(
      'useCreateContext requires an authenticated user from useCurrentUser()'
    );
  }

  return useMutation<
    Context,
    Error,
    ContextCreate,
    CreateContextMutationContext
  >({
    mutationKey: contextMutations.create, // Prevents duplicate submissions
    mutationFn: (data: ContextCreate) => createContext(data),

    // Optimistic update: Add context to cache immediately
    onMutate: async (newContext): Promise<CreateContextMutationContext> => {
      const listKey = contextKeys.list(userId);
      await queryClient.cancelQueries({ queryKey: listKey });

      const previousContexts =
        queryClient.getQueryData<Context[]>(listKey) ?? [];

      // Optimistically add new context with unique temporary ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimisticContext: Context = {
        id: tempId,
        user_id: userId,
        name: newContext.name,
        color: newContext.color,
        icon: newContext.icon,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const optimisticList = [...previousContexts, optimisticContext];
      queryClient.setQueryData<Context[]>(listKey, optimisticList);

      return { previousContexts, tempId };
    },

    // On error: Rollback to previous state
    onError: (err, _newContext, context) => {
      if (context) {
        queryClient.setQueryData(
          contextKeys.list(userId),
          context.previousContexts
        );
      }
      const appError = transformError(err);
      toast.error(appError.userMessage ?? CONTEXT_MESSAGES.createError);
      console.error(CONTEXT_MESSAGES.createError, err); // Keep for debugging
    },

    // On success: Replace optimistic data with server response
    onSuccess: (createdContext, _variables, context) => {
      // Replace optimistic entry (temp ID) with real server response before refetch
      const listKey = contextKeys.list(userId);
      const cachedList = queryClient.getQueryData<Context[]>(listKey) ?? [];
      const nextList = cachedList.map((ctx) =>
        context && ctx.id === context.tempId ? createdContext : ctx
      );
      if (!context) {
        nextList.push(createdContext);
      }
      queryClient.setQueryData<Context[]>(listKey, nextList);

      void queryClient.invalidateQueries({ queryKey: contextKeys.lists() });
      toast.success(CONTEXT_MESSAGES.createSuccess);
    },
  });
}

/**
 * Mutation hook to update a context with optimistic update.
 *
 * Updates a context and immediately reflects changes in the cache for instant
 * UI feedback. Rolls back on error and shows appropriate toast notifications.
 *
 * @param id - Context ID to update
 * @returns TanStack Mutation result with { mutate, mutateAsync, isPending, error }
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * function EditContextForm({ id }: { id: string }) {
 *   const { mutate: updateContextMutation, isPending } = useUpdateContext(id);
 *
 *   const handleSubmit = (data: ContextUpdate) => {
 *     updateContextMutation(data);
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useUpdateContext(
  id: string
): UseMutationResult<
  Context,
  Error,
  ContextUpdate,
  UpdateContextMutationContext
> {
  const queryClient = useQueryClient();
  const { userId, isAuthenticated } = useCurrentUser();

  if (!isAuthenticated || !userId) {
    throw new Error('useUpdateContext requires an authenticated user');
  }

  return useMutation<
    Context,
    Error,
    ContextUpdate,
    UpdateContextMutationContext
  >({
    mutationKey: contextMutations.update(id), // Scoped to specific context
    mutationFn: (data: ContextUpdate) => updateContext(id, data),

    // Optimistic update: Update context in cache immediately
    onMutate: async (data): Promise<UpdateContextMutationContext> => {
      const listKey = contextKeys.list(userId);
      const detailKey = contextKeys.detail(id);
      await queryClient.cancelQueries({ queryKey: listKey });
      await queryClient.cancelQueries({ queryKey: detailKey });

      const previousContext = queryClient.getQueryData<Context>(detailKey);
      const previousContexts =
        queryClient.getQueryData<Context[]>(listKey) ?? [];

      const updatedList = previousContexts.map((ctx) => {
        if (ctx.id !== id) {
          return ctx;
        }

        const updates: Partial<Context> = {
          ...(data.name != null && { name: data.name }),
          ...(data.color != null && { color: data.color }),
          ...(data.icon != null && { icon: data.icon }),
          updated_at: new Date().toISOString(),
        };

        return { ...ctx, ...updates };
      });
      queryClient.setQueryData<Context[]>(listKey, updatedList);

      if (previousContext) {
        const updates: Partial<Context> = {
          ...(data.name != null && { name: data.name }),
          ...(data.color != null && { color: data.color }),
          ...(data.icon != null && { icon: data.icon }),
          updated_at: new Date().toISOString(),
        };
        const optimisticDetail = { ...previousContext, ...updates };
        queryClient.setQueryData<Context>(detailKey, optimisticDetail);
      }

      return { previousContext, previousContexts };
    },

    onError: (err, _data, context) => {
      if (context?.previousContext) {
        queryClient.setQueryData(
          contextKeys.detail(id),
          context.previousContext
        );
      }
      if (context) {
        queryClient.setQueryData(
          contextKeys.list(userId),
          context.previousContexts
        );
      }
      const appError = transformError(err);
      toast.error(appError.userMessage ?? CONTEXT_MESSAGES.updateError);
      console.error(CONTEXT_MESSAGES.updateError, err); // Keep for debugging
    },

    onSuccess: (updatedContext) => {
      const listKey = contextKeys.list(userId);
      // Ensure both detail and list caches reflect server response before refetch
      queryClient.setQueryData<Context>(contextKeys.detail(id), updatedContext);
      const cachedList = queryClient.getQueryData<Context[]>(listKey) ?? [];
      const nextList = cachedList.map((ctx) =>
        ctx.id === id ? updatedContext : ctx
      );
      queryClient.setQueryData<Context[]>(listKey, nextList);

      void queryClient.invalidateQueries({ queryKey: contextKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: contextKeys.lists() });
      toast.success(CONTEXT_MESSAGES.updateSuccess);
    },
  });
}

/**
 * Mutation hook to delete a context with optimistic update.
 *
 * Deletes a context and immediately removes it from cache for instant UI feedback.
 * Rolls back on error and shows appropriate toast notifications.
 *
 * @param id - Context ID to delete
 * @returns TanStack Mutation result with { mutate, mutateAsync, isPending, error }
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * function DeleteContextButton({ id }: { id: string }) {
 *   const { mutate: deleteContextMutation, isPending } = useDeleteContext(id);
 *
 *   const handleDelete = () => {
 *     if (confirm('Delete this context?')) {
 *       deleteContextMutation();
 *     }
 *   };
 *
 *   return <button onClick={handleDelete} disabled={isPending}>Delete</button>;
 * }
 * ```
 */
export function useDeleteContext(
  id: string
): UseMutationResult<void, Error, void, DeleteContextMutationContext> {
  const queryClient = useQueryClient();
  const { userId, isAuthenticated } = useCurrentUser();

  if (!isAuthenticated || !userId) {
    throw new Error('useDeleteContext requires an authenticated user');
  }

  return useMutation<void, Error, void, DeleteContextMutationContext>({
    mutationKey: contextMutations.delete(id), // Scoped per-context key prevents duplicate delete collisions
    mutationFn: () => deleteContext(id),

    // Optimistic update: Remove context from cache immediately
    onMutate: async (): Promise<DeleteContextMutationContext> => {
      const listKey = contextKeys.list(userId);
      await queryClient.cancelQueries({ queryKey: listKey });

      const previousContexts =
        queryClient.getQueryData<Context[]>(listKey) ?? [];

      // Optimistically remove context from list
      const updatedList = previousContexts.filter((ctx) => ctx.id !== id);
      queryClient.setQueryData<Context[]>(listKey, updatedList);

      return { previousContexts };
    },

    onError: (err, _variables, context) => {
      if (context) {
        queryClient.setQueryData(
          contextKeys.list(userId),
          context.previousContexts
        );
      }
      const appError = transformError(err);
      toast.error(appError.userMessage ?? CONTEXT_MESSAGES.deleteError);
      console.error(CONTEXT_MESSAGES.deleteError, err); // Keep for debugging
    },

    onSuccess: () => {
      // Ensure caches are cleaned before invalidation
      const listKey = contextKeys.list(userId);
      const cachedList = queryClient.getQueryData<Context[]>(listKey) ?? [];
      const nextList = cachedList.filter((ctx) => ctx.id !== id);
      queryClient.setQueryData<Context[]>(listKey, nextList);
      queryClient.removeQueries({ queryKey: contextKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: contextKeys.lists() });
      toast.success(CONTEXT_MESSAGES.deleteSuccess);
    },
  });
}
