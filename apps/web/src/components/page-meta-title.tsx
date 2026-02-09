import { Helmet } from 'react-helmet-async';

export const PageMetaTitle = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => {
  return (
    <Helmet>
      <title>{title} - Scratch (Gists) | Your Cross-Platform Scratchpad</title>
      <meta name="description" content={description ?? ''} />
    </Helmet>
  );
};
