import { Octokit } from '@octokit/rest';
import { Gist, GistFile, GitHubUser } from '../types';

export type GithubClientAdapter = {
  getUserGists: () => Promise<Gist[]>;
  createGist: (
    description: string,
    files: { [filename: string]: string },
    isPublic?: boolean,
  ) => Promise<Gist>;
  updateGist: (
    gistId: string,
    description: string | undefined,
    files: { [filename: string]: string | null },
    isPublic?: boolean,
  ) => Promise<Gist>;
  deleteGist: (gistId: string) => Promise<void>;
  getGist: (gistId: string) => Promise<Gist>;
  getUserProfile: () => Promise<GitHubUser>;
  getRateLimitStatus: () => Promise<{
    remaining: number;
    reset: number;
    limit: number;
  }>;
};

type GithubClientOptions = {
  getToken: () => Promise<string | null> | string | null;
  checkConnectivity?: () => Promise<boolean>;
  userAgent?: string;
};

class GithubClient implements GithubClientAdapter {
  private octokit: Octokit | null = null;
  private currentToken: string | null = null;
  private rateLimitResetTime = 0;
  private isRateLimited = false;

  constructor(private readonly options: GithubClientOptions) {}

  private handleRateLimit(retryAfter: number) {
    this.isRateLimited = true;
    this.rateLimitResetTime = Date.now() + retryAfter * 1000;
    setTimeout(() => {
      this.isRateLimited = false;
    }, retryAfter * 1000);
  }

  private async ensureClient(): Promise<Octokit> {
    const token = await this.options.getToken();

    if (!token) {
      throw new Error(
        'GitHub client not initialized. Please authenticate first.',
      );
    }

    if (!this.octokit || token !== this.currentToken) {
      this.octokit = new Octokit({
        auth: token,
        userAgent: this.options.userAgent || 'Scratch/1.0.0',
      });
      this.currentToken = token;
    }

    if (this.isRateLimited) {
      const waitTime = Math.max(0, this.rateLimitResetTime - Date.now());
      throw new Error(
        `Rate limited. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`,
      );
    }

    if (this.options.checkConnectivity) {
      const isConnected = await this.options.checkConnectivity();
      if (!isConnected) {
        throw new Error('No internet connection available.');
      }
    }

    return this.octokit;
  }

  async getUserGists(): Promise<Gist[]> {
    const client = await this.ensureClient();
    const response = await client.rest.gists.list({
      per_page: 100,
    });
    return response.data as Gist[];
  }

  async createGist(
    description: string,
    files: { [filename: string]: string },
    isPublic: boolean = false,
  ): Promise<Gist> {
    const client = await this.ensureClient();
    const response = await client.rest.gists.create({
      description,
      public: isPublic,
      files: Object.keys(files).reduce(
        (acc, filename) => {
          acc[filename] = { content: files[filename] };
          return acc;
        },
        {} as { [filename: string]: { content: string } },
      ),
    });

    const gist = response.data as Gist;
    return {
      ...gist,
      files: Object.keys(gist.files || {}).reduce(
        (acc, filename) => {
          const file = gist.files[filename];
          acc[filename] = {
            filename: file?.filename ?? '',
            content: file?.content ?? '',
            type: file?.type ?? '',
            language: file?.language ?? null,
            raw_url: file?.raw_url ?? '',
            size: file?.size ?? 0,
          } as GistFile;
          return acc;
        },
        {} as { [filename: string]: GistFile },
      ),
    };
  }

  async updateGist(
    gistId: string,
    description: string | undefined,
    files: { [filename: string]: string | null },
    isPublic?: boolean,
  ): Promise<Gist> {
    const client = await this.ensureClient();
    const response = await client.rest.gists.update({
      gist_id: gistId,
      ...(description === undefined ? {} : { description }),
      ...(isPublic === undefined ? {} : { public: isPublic }),
      files: Object.keys(files).reduce(
        (acc, filename) => {
          const content = files[filename];
          acc[filename] = content === null ? null : { content };
          return acc;
        },
        {} as { [filename: string]: { content: string } | null },
      ) as any,
    });

    const gist = response.data as Gist;
    return {
      ...gist,
      files: Object.keys(gist.files || {}).reduce(
        (acc, filename) => {
          const file = gist.files[filename];
          acc[filename] = {
            filename: file?.filename ?? '',
            content: file?.content ?? '',
            type: file?.type ?? '',
            language: file?.language ?? null,
            raw_url: file?.raw_url ?? '',
            size: file?.size ?? 0,
          } as GistFile;
          return acc;
        },
        {} as { [filename: string]: GistFile },
      ),
    };
  }

  async deleteGist(gistId: string): Promise<void> {
    const client = await this.ensureClient();
    await client.rest.gists.delete({
      gist_id: gistId,
    });
  }

  async getGist(gistId: string): Promise<Gist> {
    const client = await this.ensureClient();
    const response = await client.rest.gists.get({
      gist_id: gistId,
    });

    const gist = response.data as Gist;
    return {
      ...gist,
      files: Object.keys(gist.files || {}).reduce(
        (acc, filename) => {
          const file = gist.files[filename];
          acc[filename] = {
            filename: file?.filename ?? '',
            content: file?.content ?? '',
            type: file?.type ?? '',
            language: file?.language ?? null,
            raw_url: file?.raw_url ?? '',
            size: file?.size ?? 0,
          } as GistFile;
          return acc;
        },
        {} as { [filename: string]: GistFile },
      ),
    };
  }

  async getRateLimitStatus(): Promise<{
    remaining: number;
    reset: number;
    limit: number;
  }> {
    const client = await this.ensureClient();
    const response = await client.rest.rateLimit.get();
    const core = response.data.resources.core;
    if (core.remaining === 0 && core.reset) {
      const retryAfter = Math.max(0, core.reset * 1000 - Date.now()) / 1000;
      this.handleRateLimit(retryAfter);
    }
    return {
      remaining: core.remaining,
      reset: core.reset,
      limit: core.limit,
    };
  }

  async getUserProfile(): Promise<GitHubUser> {
    const client = await this.ensureClient();
    const response = await client.rest.users.getAuthenticated();
    return response.data as GitHubUser;
  }
}

export const createGithubClient = (
  options: GithubClientOptions,
): GithubClientAdapter => new GithubClient(options);
