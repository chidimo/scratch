import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GitHubUser } from '@scratch/shared';

// Query key for user profile
export const USER_PROFILE_QUERY_KEY = ['userProfile'];

// Hook to fetch user profile
export const useUserProfile = (token: string | null) => {
  return useQuery({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: async (): Promise<GitHubUser> => {
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Fetching user profile with token:', token.substring(0, 10) + '...');

      // Fetch user profile
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'ScratchApp',
        },
      });

      console.log('User profile response status:', userResponse.status);

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('Failed to fetch user profile:', errorText);
        throw new Error(
          `Failed to fetch user profile: ${userResponse.status} - ${errorText}`,
        );
      }

      const userData = await userResponse.json();
      console.log('User data received:', {
        login: userData.login,
        id: userData.id,
        email: userData.email,
      });

      // Try to fetch user emails to get primary email
      try {
        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `token ${token}`,
            'User-Agent': 'ScratchApp',
          },
        });

        console.log('Emails response status:', emailResponse.status);

        if (emailResponse.ok) {
          const emails = await emailResponse.json();
          console.log(
            'Emails data received:',
            Array.isArray(emails) ? `${emails.length} emails` : 'Not an array',
          );

          if (Array.isArray(emails)) {
            const primaryEmail =
              emails.find((email: any) => email.primary && email.verified)?.email ||
              userData.email;
            console.log('Primary email found:', primaryEmail);
            return {
              ...userData,
              email: primaryEmail,
            };
          }
        }
      } catch (error) {
        console.warn('Failed to fetch user emails, using default email:', error);
      }

      return {
        ...userData,
        email: userData.email || '',
      };
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 10, // 10 minutes - user profile changes less frequently
    gcTime: 1000 * 60 * 30, // 30 minutes cache time
  });
};

// Hook to invalidate user profile cache
export const useInvalidateUserProfile = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEY });
  };
};

// Hook to refresh user profile
export const useRefreshUserProfile = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.refetchQueries({ queryKey: USER_PROFILE_QUERY_KEY });
  };
};
