import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gist } from '@scratch/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query key for gists
export const GISTS_QUERY_KEY = ['gists'];

// Hook to fetch gists
export const useGists = (token: string | null) => {
  return useQuery({
    queryKey: GISTS_QUERY_KEY,
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token available');
      }

      // First try to get from AsyncStorage
      const gistsStr = await AsyncStorage.getItem('github_gists');
      if (gistsStr) {
        try {
          const cachedGists = JSON.parse(gistsStr);
          return cachedGists;
        } catch (error) {
          console.warn('Failed to parse cached gists:', error);
        }
      }

      // If no cached data or parse failed, fetch from API
      const response = await fetch('https://api.github.com/gists', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch gists: ${response.statusText}`);
      }

      const gistsData = await response.json();

      // Cache the results
      await AsyncStorage.setItem('github_gists', JSON.stringify(gistsData));

      return gistsData;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
};

// Hook to create a new gist
export const useCreateGist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      description,
      files,
      public: isPublic = false,
    }: {
      description: string;
      files: Record<string, { content: string }>;
      public?: boolean;
    }) => {
      const token = await AsyncStorage.getItem('github_token');
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          public: isPublic,
          files,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create gist: ${response.status} - ${errorText}`,
        );
      }

      return response.json() as Promise<Gist>;
    },
    onSuccess: (newGist) => {
      // Update the gists cache with the new gist
      queryClient.setQueryData(GISTS_QUERY_KEY, (old: Gist[] = []) => {
        return [newGist, ...old];
      });
    },
    onError: (error) => {
      console.error('Error creating gist:', error);
    },
  });
};

// Hook to update an existing gist
export const useUpdateGist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gistId,
      description,
      files,
    }: {
      gistId: string;
      description?: string;
      files: Record<string, { content: string; filename?: string }>;
    }) => {
      const token = await AsyncStorage.getItem('github_token');
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          files,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update gist: ${response.status} - ${errorText}`,
        );
      }

      return response.json() as Promise<Gist>;
    },
    onSuccess: (updatedGist) => {
      // Update the gists cache with the updated gist
      queryClient.setQueryData(GISTS_QUERY_KEY, (old: Gist[] = []) => {
        return old.map((gist) =>
          gist.id === updatedGist.id ? updatedGist : gist,
        );
      });
    },
    onError: (error) => {
      console.error('Error updating gist:', error);
    },
  });
};

// Hook to delete a gist
export const useDeleteGist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gistId: string) => {
      const token = await AsyncStorage.getItem('github_token');
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to delete gist: ${response.status} - ${errorText}`,
        );
      }

      return gistId;
    },
    onSuccess: (deletedGistId) => {
      // Remove the deleted gist from the cache
      queryClient.setQueryData(GISTS_QUERY_KEY, (old: Gist[] = []) => {
        return old.filter((gist) => gist.id !== deletedGistId);
      });
    },
    onError: (error) => {
      console.error('Error deleting gist:', error);
    },
  });
};

// Hook to refresh gists
export const useRefreshGists = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('https://api.github.com/gists', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh gists: ${response.statusText}`);
      }

      const gistsData = await response.json();

      // Update cache with fresh data
      await AsyncStorage.setItem('github_gists', JSON.stringify(gistsData));

      return gistsData;
    },
    onSuccess: (freshGists) => {
      queryClient.setQueryData(GISTS_QUERY_KEY, freshGists);
    },
    onError: (error) => {
      console.error('Error refreshing gists:', error);
    },
  });
};

// Combined hook for all gist operations
export const useGistOperations = (token: string | null) => {
  const gistsQuery = useGists(token);
  const createGist = useCreateGist();
  const updateGist = useUpdateGist();
  const deleteGist = useDeleteGist();
  const refreshGists = useRefreshGists();

  return {
    // Query
    gists: gistsQuery.data || [],
    isLoading: gistsQuery.isLoading,
    error: gistsQuery.error,
    refetch: gistsQuery.refetch,

    // Mutations
    createGist,
    updateGist,
    deleteGist,
    refreshGists: () => (token ? refreshGists.mutate(token) : null),

    // Combined loading state
    isMutating:
      createGist.isPending ||
      updateGist.isPending ||
      deleteGist.isPending ||
      refreshGists.isPending,
  };
};

// Query key for individual notes
export const NOTE_QUERY_KEY = (id: string) => ['note', id];

// Hook to fetch a single note by ID
export const useNote = (id: string | null, token: string | null) => {
  return useQuery({
    queryKey: NOTE_QUERY_KEY(id || ''),
    queryFn: async (): Promise<Note | null> => {
      if (!id || !token) {
        throw new Error('Note ID and token are required');
      }

      const response = await fetch(`https://api.github.com/gists/${id}`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch note: ${response.statusText}`);
      }

      const gistData = await response.json();

      // Find the markdown file
      const mdFile = Object.keys(gistData.files).find((filename) =>
        filename.endsWith('.md'),
      );

      if (!mdFile) {
        throw new Error('No markdown file found in this gist');
      }

      const noteTitle = gistData.description || mdFile.replace('.md', '');
      const noteContent = gistData.files[mdFile].content || '';

      return {
        id: gistData.id,
        title: noteTitle,
        content: noteContent,
        created_at: gistData.created_at,
        updated_at: gistData.updated_at,
        tags: [], // TODO: Extract tags from content or metadata
        gist_id: gistData.id,
        sync_status: 'synced' as const,
      };
    },
    enabled: !!id && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache time
  });
};

// Hook to update a note
export const useUpdateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      content,
    }: {
      id: string;
      title: string;
      content: string;
    }) => {
      const token = await AsyncStorage.getItem('github_token');
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`https://api.github.com/gists/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: title,
          files: {
            [`${title}.md`]: {
              content: content,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update note: ${response.status} - ${errorText}`,
        );
      }

      return response.json();
    },
    onSuccess: (updatedGist, variables) => {
      // Update the note cache
      queryClient.setQueryData(
        NOTE_QUERY_KEY(variables.id),
        (old: Note | null) => {
          if (old) {
            return {
              ...old,
              title: variables.title,
              content: variables.content,
              updated_at: new Date().toISOString(),
            };
          }
          return old;
        },
      );

      // Invalidate the gists list to reflect changes
      queryClient.invalidateQueries({ queryKey: GISTS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Error updating note:', error);
    },
  });
};

// Hook to delete a note
export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await AsyncStorage.getItem('github_token');
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`https://api.github.com/gists/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to delete note: ${response.status} - ${errorText}`,
        );
      }

      return id;
    },
    onSuccess: (deletedId) => {
      // Remove the note from cache
      queryClient.removeQueries({ queryKey: NOTE_QUERY_KEY(deletedId) });

      // Invalidate the gists list
      queryClient.invalidateQueries({ queryKey: GISTS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Error deleting note:', error);
    },
  });
};

// Combined hook for note operations
export const useNoteOperations = (id: string | null, token: string | null) => {
  const noteQuery = useNote(id, token);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  return {
    // Query
    note: noteQuery.data,
    isLoading: noteQuery.isLoading,
    error: noteQuery.error,
    refetch: noteQuery.refetch,

    // Mutations
    updateNote,
    deleteNote,

    // Combined loading state
    isMutating: updateNote.isPending || deleteNote.isPending,
  };
};
