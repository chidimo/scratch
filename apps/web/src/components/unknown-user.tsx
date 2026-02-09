import { useAuth } from '../context/auth-context';
import { PageMetaTitle } from './page-meta-title';

type Props = {
  title: string;
};

export const UnknownUser = ({ title }: Props) => {
  const { isLoading: authLoading, login } = useAuth();

  return (
    <>
      <PageMetaTitle
        title="Scratch (Gists)"
        description="Sign in with GitHub to access your gists and manage your scratchpad across all platforms"
      />
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <img
                src="/scratch-icon.png"
                alt="Scratch (Gists) logo"
                className="w-20 h-20 md:w-32 md:h-32 rounded-xl mx-auto mb-6"
              />
              <h2 className="text-3xl font-bold text-gray-900 mb-3">{title}</h2>
              <p className="text-lg text-gray-600 mb-1">
                Your cross-platform scratchpad
              </p>
              <p className="text-sm text-gray-500">
                Sign in with GitHub to access and manage your gists
              </p>
            </div>

            <button
              onClick={login}
              disabled={authLoading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {authLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Sign in with GitHub
                </>
              )}
            </button>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="text-center text-sm text-gray-500 space-y-4">
                <p>Connect your GitHub account to start managing your gists</p>
                <div className="space-y-2">
                  <p>Get the extension</p>
                  <a
                    href="https://marketplace.visualstudio.com/items?itemName=chidimo.scratch"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                  >
                    Visual Studio Code marketplace →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
