import { useAuth } from '../context/auth-context';
import { useNavigate } from 'react-router-dom';
import { useLogoutUser } from '@scratch/shared';

type Props = {
  owner_avatar_url: string;
  owner_login: string;
};

export const OwnerAvatar = ({ owner_avatar_url, owner_login }: Props) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const logoutUser = useLogoutUser({
    onLogout: logout,
  });

  const profileUrl = owner_login
    ? `https://github.com/${owner_login}`
    : 'https://github.com';

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-800">
        {owner_login || 'GitHub user'}
      </span>
      <details className="relative">
        <summary className="list-none cursor-pointer">
          {owner_avatar_url ? (
            <img
              src={owner_avatar_url}
              alt={`${owner_login || 'GitHub user'} avatar`}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200" />
          )}
        </summary>
        <div className="absolute right-0 mt-2 w-44 rounded-md border border-gray-200 bg-white shadow-lg z-50">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            View GitHub profile
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      </details>
    </div>
  );
};
