import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Scratch (Gists)</title>
        <meta
          name="description"
          content="Privacy policy for Scratch (Gists)"
        />
      </Helmet>
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Link
            to="/"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Scratch (Gists)
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-6">
            Privacy Policy for Scratch (Gists)
          </h1>

          <section className="space-y-4 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">Introduction</h2>
            <p>
              Welcome to Scratch (Gists)! This privacy policy explains our
              practices regarding the collection, use, and disclosure of
              information when you use our application.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">Data Collection</h2>
            <p>
              Scratch (Gists) uses GitHub OAuth to sign you in and access your
              gists. We store your access token locally on your device and use it
              to sync gists with GitHub. We do not collect analytics or tracking
              data beyond what is required for authentication and gist syncing.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">Data Usage</h2>
            <p>
              We use your GitHub access token to fetch and update gists, and to
              display your GitHub profile details (such as username and avatar)
              within the app.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">Data Sharing</h2>
            <p>
              We do not share your personal information with third parties. Your
              data is sent only to GitHub as part of authentication and gist
              synchronization.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">User Rights</h2>
            <p>
              You can revoke access at any time by signing out of the app and
              revoking the GitHub OAuth app in your GitHub settings. You can
              also delete any gists directly on GitHub.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">
              Changes to This Privacy Policy
            </h2>
            <p>
              We may update our Privacy Policy from time to time. You are
              advised to review this page periodically for any changes. These
              changes are effective immediately after they are posted.
            </p>

            <h2 className="text-xl font-semibold text-gray-900">Contact Us</h2>
            <p>
              <span>
                If you have any questions or suggestions about our Privacy
                Policy, please open an issue at
              </span>
              <a
                className="text-blue-600 hover:text-blue-700 ml-1"
                href="https://github.com/chidimo/scratch/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/chidimo/scratch
              </a>
              <span>.</span>
            </p>

            <p className="text-sm text-gray-500">
              <i>Last updated: Feb 1, 2026</i>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
