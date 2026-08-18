import { Link } from 'react-router-dom';
import { Note } from '@scratch/shared';
import { GistVisibility } from './gist-visibility';

type Props = {
  gist: Note;
};

const MAX_VISIBLE_FILES = 3;

export const GistListItem = ({ gist }: Props) => {
  const files = gist.md_files ?? [];
  const visibleFiles = files.slice(0, MAX_VISIBLE_FILES);
  const hiddenFileCount = files.length - visibleFiles.length;

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-md ring-1 ring-brand-900/5 px-6 py-5 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-brand-900 min-w-0 flex-1">
          <Link
            to={`/gists/${gist.id}`}
            className="hover:text-brand-500 transition-colors line-clamp-1"
          >
            {gist.title || 'Untitled Gist'}
          </Link>
        </h3>
        <span className="text-sm text-gray-500 whitespace-nowrap shrink-0">
          {new Date(gist.updated_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>

      <div className="flex-1 mb-4">
        {visibleFiles.map((file) => (
          <div
            key={`${gist.id}-${file}`}
            className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-b-0"
          >
            <span className="font-mono text-sm text-gray-700 truncate">
              {file}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md shrink-0">
              Markdown
            </span>
          </div>
        ))}
        {hiddenFileCount > 0 ? (
          <p className="text-xs text-gray-400 pt-2">
            +{hiddenFileCount} more file{hiddenFileCount === 1 ? '' : 's'}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
        <GistVisibility isPublic={gist.is_public ?? false} />
        <div className="flex items-center gap-4">
          <Link
            to={`/gists/${gist.id}`}
            className="text-brand-500 hover:text-brand-600 font-medium text-sm transition-colors"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
};
