import { Octokit } from '@octokit/rest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Gist, GistFile } from '@scratch/shared';

class GithubClient {
  private octokit: Octokit | null = null;
  private rateLimitResetTime: number = 0;
  private isRateLimited: boolean = false;
  private initialized: boolean = false;

  private async initializeClient() {
    if (this.initialized) {
      return;
    }

    try {
      const token = await AsyncStorage.getItem('github_token');
      if (token) {
        this.octokit = new Octokit({
          auth: token,
          userAgent: 'ScratchApp/1.0.0',
          throttle: {
            onRateLimit: (retryAfter: number, options: any) => {
              this.handleRateLimit(retryAfter, options);
              return true;
            },
            onAbuseLimit: (retryAfter: number, options: any) => {
              this.handleAbuseLimit(retryAfter, options);
              return true;
            },
          },
        });
      }
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing GitHub client:', error);
      this.initialized = true; // Mark as initialized even on error to avoid retry loops
    }
  }

  private handleRateLimit(retryAfter: number, options: any) {
    console.warn(
      `Rate limit hit for ${options.method} ${options.url}. Retrying after ${retryAfter} seconds.`,
    );
    this.isRateLimited = true;
    this.rateLimitResetTime = Date.now() + retryAfter * 1000;

    setTimeout(() => {
      this.isRateLimited = false;
    }, retryAfter * 1000);
  }

  private handleAbuseLimit(retryAfter: number, options: any) {
    console.error(
      `Abuse limit hit for ${options.method} ${options.url}. Retrying after ${retryAfter} seconds.`,
    );
    this.isRateLimited = true;
    this.rateLimitResetTime = Date.now() + retryAfter * 1000;

    setTimeout(() => {
      this.isRateLimited = false;
    }, retryAfter * 1000);
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected ?? false;
    } catch (error) {
      console.error('Error checking connectivity:', error);
      return false;
    }
  }

  private async ensureClient(): Promise<Octokit> {
    if (!this.octokit) {
      await this.initializeClient();
    }

    if (!this.octokit) {
      throw new Error(
        'GitHub client not initialized. Please authenticate first.',
      );
    }

    if (this.isRateLimited) {
      const waitTime = Math.max(0, this.rateLimitResetTime - Date.now());
      throw new Error(
        `Rate limited. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`,
      );
    }

    const isConnected = await this.checkConnectivity();
    if (!isConnected) {
      throw new Error('No internet connection available.');
    }

    return this.octokit;
  }

  async getUserGists(): Promise<Gist[]> {
    try {
      const client = await this.ensureClient();
      const response = await client.rest.gists.list({
        per_page: 100,
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching user gists:', error);
      throw error;
    }
  }

  async createGist(
    description: string,
    files: { [filename: string]: string },
    isPublic: boolean = false,
  ): Promise<Gist> {
    try {
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

      const gist = response.data;
      return {
        id: gist.id!,
        description: gist.description || '',
        public: gist.public ?? false,
        created_at: gist.created_at ?? '',
        updated_at: gist.updated_at ?? '',
        files: Object.keys(gist.files || {}).reduce(
          (acc, filename) => {
            const file = gist.files![filename];
            acc[filename] = {
              filename: file?.filename ?? '',
              content: file?.content ?? '',
            };
            return acc;
          },
          {} as { [filename: string]: GistFile },
        ),
      };
    } catch (error) {
      console.error('Error creating gist:', error);
      throw error;
    }
  }

  async updateGist(
    gistId: string,
    description: string,
    files: { [filename: string]: string },
  ): Promise<Gist> {
    try {
      const client = await this.ensureClient();
      const response = await client.rest.gists.update({
        gist_id: gistId,
        description,
        files: Object.keys(files).reduce(
          (acc, filename) => {
            acc[filename] = { content: files[filename] };
            return acc;
          },
          {} as { [filename: string]: { content: string } },
        ),
      });

      const gist = response.data;
      return {
        id: gist.id!,
        description: gist.description || '',
        public: gist.public ?? false,
        created_at: gist.created_at ?? '',
        updated_at: gist.updated_at ?? '',
        files: Object.keys(gist.files || {}).reduce(
          (acc, filename) => {
            const file = gist.files![filename];
            acc[filename] = {
              filename: file?.filename ?? '',
              content: file?.content ?? '',
            };
            return acc;
          },
          {} as { [filename: string]: GistFile },
        ),
      };
    } catch (error) {
      console.error('Error updating gist:', error);
      throw error;
    }
  }

  async deleteGist(gistId: string): Promise<void> {
    try {
      const client = await this.ensureClient();
      await client.rest.gists.delete({
        gist_id: gistId,
      });
    } catch (error) {
      console.error('Error deleting gist:', error);
      throw error;
    }
  }

  async getGist(gistId: string): Promise<Gist> {
    try {
      const client = await this.ensureClient();
      const response = await client.rest.gists.get({
        gist_id: gistId,
      });

      const gist = response.data;
      return {
        id: gist.id!,
        description: gist.description || '',
        public: gist.public ?? false,
        created_at: gist.created_at ?? '',
        updated_at: gist.updated_at ?? '',
        files: Object.keys(gist.files || {}).reduce(
          (acc, filename) => {
            const file = gist.files![filename];
            acc[filename] = {
              filename: file?.filename ?? '',
              content: file?.content ?? '',
            };
            return acc;
          },
          {} as { [filename: string]: GistFile },
        ),
      };
    } catch (error) {
      console.error('Error fetching gist:', error);
      throw error;
    }
  }

  async getRateLimitStatus(): Promise<{
    remaining: number;
    reset: number;
    limit: number;
  }> {
    try {
      const client = await this.ensureClient();
      const response = await client.rest.rateLimit.get();
      return {
        remaining: response.data.resources.core.remaining,
        reset: response.data.resources.core.reset,
        limit: response.data.resources.core.limit,
      };
    } catch (error) {
      console.error('Error fetching rate limit status:', error);
      throw error;
    }
  }
}

// Create a singleton instance that's only initialized when needed
let githubClientInstance: GithubClient | null = null;

export const getGithubClient = (): GithubClient => {
  githubClientInstance ??= new GithubClient();
  return githubClientInstance;
};
