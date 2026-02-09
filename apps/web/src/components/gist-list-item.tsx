import { Link } from 'react-router-dom';
import { Note } from '@scratch/shared';
import { GistVisibility } from './gist-visibility';

type Props = {
  gist: Note;
};

export const GistListItem = ({ gist }: Props) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 px-6 py-4 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4">
          <Link
            to={`/gists/${gist.id}`}
            className="hover:text-blue-600 transition-colors"
          >
            {gist.title || 'Untitled Gist'}
          </Link>
        </h3>
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {new Date(gist.updated_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>

      <div className="mb-4">
        {(gist.md_files ?? []).map((file) => (
          <div
            key={`${gist.id}-${file}`}
            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0"
          >
            <span className="font-mono text-sm text-gray-700">{file}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
              Markdown
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <GistVisibility isPublic={gist.is_public ?? false} />
        <div className="flex items-center gap-4">
          <Link
            to={`/gists/${gist.id}`}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
};
