type Props = {
  isPublic: boolean;
};

export const GistVisibility = ({ isPublic }: Props) => {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full whitespace-nowrap ${
        isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {isPublic ? '🌐 Public' : '🔒 Private'}
    </span>
  );
};
