import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gist, Note } from '../types';
import { GithubClientAdapter } from '../services/github-client';

export const GISTS_QUERY_KEY = 'gists';

type BaseHookOptions = {
  githubClient: GithubClientAdapter;
  enabled?: boolean;
};

export const useGists = ({
  searchTerm,
  githubClient,
  enabled = true,
}: {
  searchTerm?: string;
} & BaseHookOptions) => {
  const normalizedSearch = searchTerm?.trim();
  const queryKey = normalizedSearch
    ? [GISTS_QUERY_KEY, normalizedSearch]
    : [GISTS_QUERY_KEY];

  return useQuery({
    queryKey,
    queryFn: async () => {
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
    enabled,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
  });
};

export const useCreateGist = ({ githubClient }: BaseHookOptions) => {
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
      if (!files || Object.keys(files).length === 0) {
        throw new Error('At least one file is required to create a gist.');
      }

      const filesForClient: { [filename: string]: string } = {};
      Object.entries(files).forEach(([filename, fileData]) => {
        filesForClient[filename] = fileData.content;
      });

      return githubClient.createGist(description, filesForClient, isPublic);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GISTS_QUERY_KEY] });
    },
  });
};

export const useUpdateGistById = ({ githubClient }: BaseHookOptions) => {
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
      const trimmedTitle = title.trim();
      const nextFileName = `${trimmedTitle}.md`;

      const files: Record<string, string | null> = {};
      if (fileName && fileName !== nextFileName) {
        files[fileName] = null;
      }
      files[nextFileName] = content;

      return githubClient.updateGist(id, title, files, isPublic);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GISTS_QUERY_KEY] });
    },
  });
};

export const useUpdateGistFileContent = ({ githubClient }: BaseHookOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      fileName,
      content,
      isPublic,
    }: {
      id: string;
      fileName: string;
      content: string;
      isPublic?: boolean;
    }) => {
      return githubClient.updateGist(
        id,
        undefined,
        { [fileName]: content },
        isPublic,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GISTS_QUERY_KEY] });
    },
  });
};

export const useDeleteGistById = ({ githubClient }: BaseHookOptions) => {
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
  });
};

export const useRefreshGists = ({
  githubClient,
  persistGists,
}: BaseHookOptions & {
  persistGists?: (gists: Gist[]) => Promise<void>;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const gistsData = await githubClient.getUserGists();

      if (persistGists) {
        await persistGists(gistsData);
      }

      return gistsData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GISTS_QUERY_KEY] });
    },
  });
};

export const useGistById = (
  id: string | null,
  {
    githubClient,
    enabled = true,
  }: BaseHookOptions,
) => {
  return useQuery({
    queryKey: [GISTS_QUERY_KEY, id],
    queryFn: async (): Promise<Note | null> => {
      if (!id) {
        throw new Error('Note ID is required');
      }

      const gistData = await githubClient.getGist(id);

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
        tags: [],
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
    enabled: !!id && enabled,
  });
};
