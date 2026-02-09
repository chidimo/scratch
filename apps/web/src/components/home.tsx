import { UnknownUser } from './unknown-user';
import { Navigate } from 'react-router-dom';
import { PageMetaTitle } from './page-meta-title';
import { useUserWithClient } from '../hooks/use-shared-hooks';

export const Home = () => {
  const { user, isPending } = useUserWithClient();

  if (isPending) {
    return (
      <>
        <PageMetaTitle title="Loading" />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Application is loading...
            </h2>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return <UnknownUser title="Scratch (Gists)" />;
  }

  return <Navigate to="/gists" />;
};
