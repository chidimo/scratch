import { OwnerAvatar } from './owner-avatar';
import { Link } from 'react-router-dom';
import { useUserWithClient } from '../hooks/use-shared-hooks';

export const KnownUserHeader = () => {
  const { user } = useUserWithClient();

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/">
            <div className="flex items-center gap-4">
              <img
                src="/scratch-icon.png"
                alt="Scratch (Gists) logo"
                className="w-10 h-10 rounded-xl"
              />
              <h1 className="text-lg font-bold text-gray-900">
                Scratch (Gists)
              </h1>
            </div>
          </Link>

          <OwnerAvatar
            owner_avatar_url={user?.avatar_url ?? ''}
            owner_login={user?.login ?? ''}
          />
        </div>
      </div>
    </header>
  );
};
