import { useMemo } from 'react';
import { getGithubClient } from '../services/github-client';
import { useUserProfile } from '@scratch/shared';

export const useUserWithClient = () => {
  const githubClient = useMemo(() => getGithubClient(), []);
  const { data: user, isPending } = useUserProfile({ githubClient });

  return { user, githubClient, isPending };
};
