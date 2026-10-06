export const NEW_GIST_PLACEHOLDER = '# New note';

// GitHub file names can't contain path separators.
const toFileName = (title: string) => `${title.replace(/[/\\]+/g, '-')}.md`;

/** Builds the createGist payload for a new private markdown note. */
export const buildNewGist = (rawTitle: string) => {
  const title = rawTitle.trim();
  if (!title) {
    return null;
  }

  return {
    description: title,
    files: { [toFileName(title)]: { content: NEW_GIST_PLACEHOLDER } },
    public: false,
  };
};
