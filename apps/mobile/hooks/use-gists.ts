import { getGithubClient } from '@/services/GithubClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '@scratch/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query key for gists
export const GISTS_QUERY_KEY = 'gists';

export const useGists = (searchTerm?: string) => {
  return useQuery({
    queryKey: [GISTS_QUERY_KEY, searchTerm],
    queryFn: async () => {
      const githubClient = getGithubClient();
      const gistsData = await githubClient.getUserGists();

      let filteredGists = gistsData.filter((gist) =>
        Object.keys(gist.files).some((filename) => filename.endsWith('.md')),
      );

      // Apply search filter if search term is provided
      if (searchTerm?.trim()) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredGists = filteredGists.filter(
          (gist) =>
            (gist.description || '').toLowerCase().includes(lowerSearchTerm) ||
            Object.keys(gist.files).some((filename) =>
              filename.toLowerCase().includes(lowerSearchTerm),
            ),
        );
      }

      return filteredGists.map((gist) => {
        const mdFile = Object.keys(gist.files).find((filename) =>
          filename.endsWith('.md'),
        );
        return {
          id: gist.id,
          title:
            gist.description || mdFile?.replace('.md', '') || 'Untitled Note',
          content: mdFile ? gist.files[mdFile].content || '' : '',
          created_at: gist.created_at,
          updated_at: gist.updated_at,
          tags: [],
          gist_id: gist.id,
          sync_status: 'synced' as const,
        };
      });
    },
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
      const githubClient = getGithubClient();

      // Convert files format to match GithubClient interface
      const filesForClient: { [filename: string]: string } = {};
      Object.entries(files).forEach(([filename, fileData]) => {
        filesForClient[filename] = fileData.content;
      });

      return await githubClient.createGist(
        description,
        filesForClient,
        isPublic,
      );
    },
    onSuccess: (newGist) => {
      // Update the gists cache with the new gist
      queryClient.invalidateQueries({ queryKey: [GISTS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Error creating gist:', error);
    },
  });
};

// Hook to update a note
export const useUpdateGistById = () => {
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
      const githubClient = getGithubClient();

      const files = {
        [`${title}.md`]: content,
      };

      return await githubClient.updateGist(id, title, files);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GISTS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Error updating note:', error);
    },
  });
};

// Hook to delete a note
export const useDeleteGistById = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const githubClient = getGithubClient();
      await githubClient.deleteGist(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GISTS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Error deleting note:', error);
    },
  });
};

// Hook to refresh gists
export const useRefreshGists = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const githubClient = getGithubClient();
      const gistsData = await githubClient.getUserGists();

      await AsyncStorage.setItem('github_gists', JSON.stringify(gistsData));

      return gistsData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GISTS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Error refreshing gists:', error);
    },
  });
};

// Hook to fetch a single note by ID
export const useGistById = (id: string | null) => {
  return useQuery({
    queryKey: [GISTS_QUERY_KEY, id],
    queryFn: async (): Promise<Note | null> => {
      if (!id) {
        throw new Error('Note ID is required');
      }

      const githubClient = getGithubClient();
      const gistData = await githubClient.getGist(id);

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
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache time
  });
};

// Combined hook for note operations
export const useGistOperationsById = (id: string | null) => {
  const noteQuery = useGistById(id);
  const updateNote = useUpdateGistById();
  const deleteNote = useDeleteGistById();

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
