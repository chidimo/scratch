export const AppFooter = () => {
  return (
    <footer className="border-t border-brand-900/5 py-6">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()}. All rights reserved. Built with{' '}
          <span className="text-accent-pink">❤</span>
          {'. '}
          <a
            href="/privacy"
            className="text-sm text-gray-500 hover:text-brand-500 transition-colors"
          >
            Privacy Policy
          </a>
          {' · '}
          <a
            href="https://buymeacoffee.com/chidimo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-brand-500 transition-colors"
          >
            Buy me a coffee
          </a>
        </p>
      </div>
    </footer>
  );
};
