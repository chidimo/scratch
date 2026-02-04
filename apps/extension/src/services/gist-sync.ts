import { Octokit } from "@octokit/rest";

export interface GistSummary {
  id: string;
  description: string | null;
  htmlUrl: string;
  fileCount: number;
  fileNames: string[];
}

export interface GistFile {
  filename: string;
  content: string;
}

export interface GistDetail extends GistSummary {
  files: GistFile[];
}

function createOctokit(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken });
}

export async function createGist(
  accessToken: string,
  options: {
    description: string;
    files: Record<string, string>;
    isPublic?: boolean;
  }
): Promise<GistDetail> {
  const octokit = createOctokit(accessToken);
  const response = await octokit.request("POST /gists", {
    description: options.description,
    public: options.isPublic ?? false,
    files: Object.keys(options.files).reduce(
      (acc, filename) => {
        acc[filename] = { content: options.files[filename] };
        return acc;
      },
      {} as Record<string, { content: string }>
    ),
  });

  const files = Object.values(response.data.files ?? {})
    .filter((file) => Boolean(file?.filename))
    .map((file) => ({
      filename: file?.filename ?? "untitled.txt",
      content: file?.content ?? "",
    }));

  return {
    id: response.data.id ?? "",
    description: response.data.description ?? null,
    htmlUrl: response.data.html_url ?? "",
    fileCount: files.length,
    fileNames: files.map((file) => file.filename),
    files,
  };
}

export async function listGists(accessToken: string): Promise<GistSummary[]> {
  const octokit = createOctokit(accessToken);
  const response = await octokit.request("GET /gists", {
    per_page: 50,
    page: 1,
  });

  type GistItem = (typeof response.data)[number];
  return response.data.map((gist: GistItem) => ({
    id: gist.id,
    description: gist.description ?? null,
    htmlUrl: gist.html_url,
    fileCount: Object.keys(gist.files ?? {}).length,
    fileNames: Object.keys(gist.files ?? {}),
  }));
}

export async function fetchGist(
  accessToken: string,
  gistId: string
): Promise<GistDetail> {
  const octokit = createOctokit(accessToken);
  const response = await octokit.request("GET /gists/{gist_id}", {
    gist_id: gistId,
  });

  const files = Object.values(response.data.files ?? {})
    .filter((file) => Boolean(file?.filename))
    .map((file) => ({
      filename: file?.filename ?? "untitled.txt",
      content: file?.content ?? "",
    }));

  return {
    id: response.data.id ?? gistId,
    description: response.data.description ?? null,
    htmlUrl: response.data.html_url ?? "",
    fileCount: files.length,
    fileNames: files.map((file) => file.filename),
    files,
  };
}

export async function updateGistFile(options: {
  accessToken: string;
  gistId: string;
  filename: string;
  content: string | null;
}): Promise<void> {
  const octokit = createOctokit(options.accessToken);
  const files: Record<string, { content?: string } | null> = {
    [options.filename]:
      options.content === null ? null : { content: options.content },
  };
  await octokit.request("PATCH /gists/{gist_id}", {
    gist_id: options.gistId,
    files: files as unknown as Record<string, { content?: string }>,
  });
}
