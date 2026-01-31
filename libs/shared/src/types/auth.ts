import { ReactNode } from 'react';

// GitHub User interface - matches GitHub API response
export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  hireable: boolean;
  bio: string;
  twitter_username: string | null;
  notification_email: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

// Gist interfaces - matches GitHub API response
export interface GistFile {
  filename: string;
  type: string;
  language: string | null;
  raw_url: string;
  size: number;
  content?: string;
}

export interface Gist {
  id: string;
  description: string | null;
  public: boolean;
  created_at: string;
  updated_at: string;
  files: Record<string, GistFile>;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
  };
  html_url: string;
}

// Note interface for mobile app
export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  gist_id?: string;
  sync_status: 'synced' | 'pending' | 'error';
}

// Auth context interfaces
export interface AuthState {
  user: GitHubUser | null;
  token: string | null;
   isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login?: () => void;
  logout?: () => void;
  signIn?: () => Promise<void>;
  signOut?: () => Promise<void>;
  completeAuth?: (code: string, codeVerifier?: string | null) => Promise<void>;
  setUser?: (user: GitHubUser | null) => void;
  setToken?: (token: string | null) => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}
