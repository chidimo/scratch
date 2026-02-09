import { useMemo } from 'react';
import { getGithubClient } from '../services/github-client';
import { useUserProfile } from '@scratch/shared';
import { useAuth } from '../context/auth-context';

export const useUserWithClient = () => {
  const { hasToken } = useAuth();
  const githubClient = useMemo(() => getGithubClient(), []);

  const { data: user, isPending } = useUserProfile({
    githubClient,
    enabled: hasToken,
  });

  return { user, githubClient, isPending: hasToken ? isPending : false };
};
