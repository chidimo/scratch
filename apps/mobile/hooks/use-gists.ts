import { GISTS_STORAGE_KEY } from '@/constants/app-constants';
import { useAuth } from '@/context/AuthContext';
import { getGithubClient } from '@/services/GithubClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '@scratch/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const GISTS_QUERY_KEY = 'gists';

export const useGists = ({ searchTerm }: { searchTerm?: string }) => {
  const { token } = useAuth();
  const normalizedSearch = searchTerm?.trim();
  const queryKey = normalizedSearch
    ? [GISTS_QUERY_KEY, normalizedSearch]
    : [GISTS_QUERY_KEY];

  console.log({ queryKey })


  return useQuery({
    queryKey,
    queryFn: async () => {
      const githubClient = getGithubClient();
      const gistsData = await githubClient.getUserGists();

      return gistsData
        .filter((gist) => {
          return Object.keys(gist.files).some((fn) => fn.endsWith('.md'));
        })
        .filter((gist) => {
          const st = searchTerm?.toLowerCase();
          if (st) {
            return (
              (gist.description || '').toLowerCase().includes(st) ||
              Object.keys(gist.files).some((fn) =>
                fn.toLowerCase().includes(st),
              )
            );
          }
          return true;
        })
        .map((gist) => {
          const mdFiles = Object.keys(gist.files).filter((fn) =>
            fn.endsWith('.md'),
          );
          const mdFileCount = mdFiles.length;
          const primaryFile = mdFiles[0] ?? '';
          const fileContents: Record<string, string> = {};

          mdFiles.forEach((mdFile) => {
            fileContents[mdFile] = gist.files[mdFile].content || '';
          });

          return {
            id: gist.id,
            title:
              gist.description ||
              (primaryFile ? primaryFile.replace('.md', '') : 'Untitled Note'),
            content: primaryFile ? fileContents[primaryFile] : '',
            created_at: gist.created_at,
            updated_at: gist.updated_at,
            tags: [],
            gist_id: gist.id,
            file_name: primaryFile,
            md_file_count: mdFileCount,
            md_files: mdFiles,
            file_contents: fileContents,
            is_public: gist.public,
            owner_login: gist.owner?.login,
            sync_status: 'synced' as const,
          };
        });
    },
    enabled: !!token,
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
      if (!files || Object.keys(files).length === 0) {
        throw new Error('At least one file is required to create a gist.');
      }

      // Convert files format to match GithubClient interface
      const filesForClient: { [filename: string]: string } = {};
      Object.entries(files).forEach(([filename, fileData]) => {
        filesForClient[filename] = fileData.content;
      });
      console.log('creating gist', { description, filesForClient, isPublic });

      const gist = await githubClient.createGist(
        description,
        filesForClient,
        isPublic,
      );
      console.log('gist created', gist);
      return gist;
    },
    onSuccess: () => {
      console.log('invalidating gists query', [GISTS_QUERY_KEY]);
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
      isPublic,
      fileName,
    }: {
      id: string;
      title: string;
      content: string;
      isPublic?: boolean;
      fileName?: string;
    }) => {
      const githubClient = getGithubClient();
      const trimmedTitle = title.trim();
      const nextFileName = `${trimmedTitle}.md`;

      const files: Record<string, string | null> = {};
      if (fileName && fileName !== nextFileName) {
        files[fileName] = null;
      }
      files[nextFileName] = content;

      return await githubClient.updateGist(id, title, files, isPublic);
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
    mutationFn: async ({
      id,
      fileName,
      mdFileCount,
    }: {
      id: string;
      fileName?: string;
      mdFileCount?: number;
    }) => {
      const githubClient = getGithubClient();
      if (fileName && (mdFileCount ?? 1) > 1) {
        await githubClient.updateGist(id, undefined, { [fileName]: null });
        return id;
      }
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

      await AsyncStorage.setItem(GISTS_STORAGE_KEY, JSON.stringify(gistsData));

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
export const useGistById = (
  id: string | null,
  options?: { enabled?: boolean },
) => {
  const { token } = useAuth();
  const isEnabled = options?.enabled ?? true;

  return useQuery({
    queryKey: [GISTS_QUERY_KEY, id],
    queryFn: async (): Promise<Note | null> => {
      if (!id) {
        throw new Error('Note ID is required');
      }

      const githubClient = getGithubClient();
      const gistData = await githubClient.getGist(id);

      // Find the markdown file
      const mdFiles = Object.keys(gistData.files).filter((filename) =>
        filename.endsWith('.md'),
      );
      const mdFile = mdFiles[0] ?? null;

      if (!mdFile) {
        throw new Error('No markdown file found in this gist');
      }

      const noteTitle = mdFile.replace('.md', '') || gistData.description || '';
      const noteContent = gistData.files[mdFile].content || '';
      const fileContents: Record<string, string> = {};
      mdFiles.forEach((file) => {
        fileContents[file] = gistData.files[file].content || '';
      });

      return {
        id: gistData.id,
        title: noteTitle,
        content: noteContent,
        created_at: gistData.created_at,
        updated_at: gistData.updated_at,
        tags: [], // Extract tags from content or metadata
        gist_id: gistData.id,
        file_name: mdFile,
        md_file_count: mdFiles.length,
        md_files: mdFiles,
        file_contents: fileContents,
        is_public: gistData.public,
        owner_login: gistData.owner?.login,
        sync_status: 'synced' as const,
      };
    },
    enabled: !!id && !!token && isEnabled,
  });
};
